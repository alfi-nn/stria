import numpy as np
import cv2
from pathlib import Path
import time

class ImprovedStringArtGenerator:
    def __init__(self, img_path, n_nails, max_lines, min_distance=20):
        """Initialize the String Art Generator
        
        Args:
            img_path: Path to source image
            n_nails: Number of nails around the circle
            max_lines: Maximum number of lines to generate
            min_distance: Minimum nail distance (prevents adjacent nail connections)
        """
        self.img_path = img_path
        self.n_nails = n_nails
        self.max_lines = max_lines
        self.min_distance = min_distance
        
        # Load and preprocess image
        print("Loading and preprocessing image...")
        self.original = cv2.imread(img_path)
        if self.original is None:
            raise ValueError(f"Could not load image: {img_path}")
        
        self.img = self._preprocess_image()
        self.height, self.width = self.img.shape
        self.center = self.height // 2
        self.radius = self.center - 1
        
        # Calculate thread weight based on image statistics
        self.thread_weight = self._calculate_thread_weight()
        print(f"Thread weight: {self.thread_weight:.3f}")
        
        # Initialize nail positions
        self.nail_coords = self._calculate_nail_positions()
        
        # Pre-calculate all line coordinates
        print("Pre-calculating line paths...")
        self.line_cache = self._precalculate_lines()
        print(f"Cached {len(self.line_cache)} unique line paths")
        
        # Initialize working image (tracks remaining darkness to draw)
        # Start with original darkness values
        self.work_img = self.img.copy().astype(np.float32)
        
        # Initialize result (white canvas that we darken)
        self.result_img = np.ones_like(self.img, dtype=np.float32) * 255
        
    def _preprocess_image(self):
        """Preprocess image: crop to square, grayscale, circular mask, invert"""
        # Crop to square (center crop)
        h, w = self.original.shape[:2]
        size = min(h, w)
        start_y = (h - size) // 2
        start_x = (w - size) // 2
        square = self.original[start_y:start_y+size, start_x:start_x+size]
        
        # Convert to grayscale
        gray = cv2.cvtColor(square, cv2.COLOR_BGR2GRAY)
        
        # Apply circular mask
        h, w = gray.shape
        center = h // 2
        Y, X = np.ogrid[:h, :w]
        dist = np.sqrt((X - center)**2 + (Y - center)**2)
        mask = dist <= (center - 1)
        
        masked = np.ones_like(gray) * 255
        masked[mask] = gray[mask]
        
        # CRITICAL FIX: Invert the image
        # Dark pixels (0) should become high values (255) = "need lots of thread"
        # Light pixels (255) should become low values (0) = "need no thread"
        inverted = 255 - masked
        
        # Optional: Apply contrast enhancement for better results
        inverted = self._enhance_contrast(inverted)
        
        return inverted
    
    def _enhance_contrast(self, img):
        """Enhance contrast using CLAHE for better thread distribution"""
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        
        # Apply CLAHE to the entire image first (needs 2D structure)
        enhanced_full = clahe.apply(img)
        
        # Only apply to the circular region
        h, w = img.shape
        center = h // 2
        Y, X = np.ogrid[:h, :w]
        dist = np.sqrt((X - center)**2 + (Y - center)**2)
        mask = dist <= (center - 1)
        
        enhanced = img.copy()
        enhanced[mask] = enhanced_full[mask]
        
        return enhanced
    
    def _calculate_thread_weight(self):
        """Calculate adaptive thread weight
        
        Key insight: Thread weight should be proportional to:
        - Average image intensity (darker images need darker threads)
        - Inversely proportional to max_lines (more lines = lighter weight)
        """
        # Calculate average darkness in the meaningful region (not background)
        meaningful_pixels = self.img[self.img > 10]
        if len(meaningful_pixels) == 0:
            avg_intensity = 128
        else:
            avg_intensity = np.mean(meaningful_pixels)
        
        # Adaptive formula with improved calibration
        # Base weight represents the darkness a single line adds
        base_weight = avg_intensity * 0.2
        
        # Scale by line count: more lines = each line should be lighter
        line_factor = np.sqrt(3000 / max(self.max_lines, 1))
        
        weight = base_weight * line_factor
        
        # Clamp to reasonable bounds
        weight = np.clip(weight, 3, 40)
        
        return weight
    
    def _calculate_nail_positions(self):
        """Calculate (x, y) coordinates of nails around circle"""
        angles = np.linspace(0, 2 * np.pi, self.n_nails, endpoint=False)
        coords = []
        for angle in angles:
            x = int(self.center + self.radius * np.cos(angle))
            y = int(self.center + self.radius * np.sin(angle))
            coords.append((x, y))
        return coords
    
    def _get_line_coords(self, start, end):
        """Get coordinates of pixels along line (Bresenham's algorithm)"""
        x0, y0 = self.nail_coords[start]
        x1, y1 = self.nail_coords[end]
        
        coords = []
        dx = abs(x1 - x0)
        dy = abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy
        
        x, y = x0, y0
        while True:
            if 0 <= x < self.width and 0 <= y < self.height:
                coords.append((y, x))
            
            if x == x1 and y == y1:
                break
            
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x += sx
            if e2 < dx:
                err += dx
                y += sy
        
        return coords
    
    def _precalculate_lines(self):
        """Pre-calculate all possible line coordinates"""
        cache = {}
        
        for i in range(self.n_nails):
            for j in range(i + 1, self.n_nails):
                # Calculate circular distance between nails
                dist = min(abs(i - j), self.n_nails - abs(i - j))
                
                # Skip if nails are too close
                if dist < self.min_distance:
                    continue
                
                coords = self._get_line_coords(i, j)
                cache[(i, j)] = coords
                cache[(j, i)] = coords  # Symmetric
        
        return cache
    
    def _calculate_line_score(self, line_coords):
        """Calculate score for a line based on remaining darkness
        
        Improved scoring: Use average instead of sum to normalize by line length
        This prevents bias toward longer lines
        """
        if len(line_coords) == 0:
            return 0
        
        total = 0
        for y, x in line_coords:
            total += self.work_img[y, x]
        
        # Return average darkness along the line
        return total / len(line_coords)
    
    def _draw_line(self, line_coords):
        """Draw line on result and subtract from working image"""
        for y, x in line_coords:
            # Darken the result image
            self.result_img[y, x] = max(0, self.result_img[y, x] - self.thread_weight)
            
            # Subtract from work image (tracks remaining darkness needed)
            self.work_img[y, x] = max(0, self.work_img[y, x] - self.thread_weight)
    
    def generate_step(self):
        """Generator that yields (nail_index, progress_info) step-by-step"""
        sequence = []
        
        # Start at nail with highest average darkness in its vicinity
        current_nail = self._find_best_starting_nail()
        sequence.append(current_nail)
        yield current_nail, {"line": 0, "total": self.max_lines}
        
        last_nail = -1
        consecutive_low_scores = 0
        
        for line_idx in range(self.max_lines):
            best_score = -1
            best_nail = -1
            
            # Find the best next nail
            for next_nail in range(self.n_nails):
                if next_nail == current_nail or next_nail == last_nail:
                    continue
                
                # Check if line exists in cache (respects min_distance)
                if (current_nail, next_nail) not in self.line_cache:
                    continue
                
                line_coords = self.line_cache[(current_nail, next_nail)]
                score = self._calculate_line_score(line_coords)
                
                if score > best_score:
                    best_score = score
                    best_nail = next_nail
            
            # Improved stopping criteria
            if best_nail == -1:
                print(f"\nNo valid nail found at line {line_idx}")
                break
            
            # Stop if score is too low (diminishing returns) - REMOVED per user request
            # threshold = self.thread_weight * 2
            # if best_score < threshold:
            #     consecutive_low_scores += 1
            #     if consecutive_low_scores >= 5:
            #         print(f"\nStopped at line {line_idx}: low scores")
            #         break
            # else:
            #     consecutive_low_scores = 0
            
            # Draw the line
            line_coords = self.line_cache[(current_nail, best_nail)]
            self._draw_line(line_coords)
            
            # Update state
            last_nail = current_nail
            current_nail = best_nail
            sequence.append(current_nail)
            
            # Yield progress
            if (line_idx + 1) % 100 == 0:
                remaining_darkness = np.sum(self.work_img) / np.sum(self.img) * 100
                yield current_nail, {
                    "line": line_idx + 1,
                    "total": self.max_lines,
                    "score": best_score,
                    "remaining": remaining_darkness
                }
            else:
                yield current_nail, {"line": line_idx + 1, "total": self.max_lines}
    
    def _find_best_starting_nail(self):
        """Find the best starting nail (area with most darkness)"""
        nail_scores = []
        
        for nail_idx in range(self.n_nails):
            x, y = self.nail_coords[nail_idx]
            
            # Sample a small region around the nail
            region_size = 20
            y1 = max(0, y - region_size)
            y2 = min(self.height, y + region_size)
            x1 = max(0, x - region_size)
            x2 = min(self.width, x + region_size)
            
            region = self.img[y1:y2, x1:x2]
            avg_darkness = np.mean(region)
            nail_scores.append(avg_darkness)
        
        return np.argmax(nail_scores)
    
    def generate(self):
        """Main generation loop"""
        print(f"\nGenerating up to {self.max_lines} lines with {self.n_nails} nails...")
        print(f"Minimum nail distance: {self.min_distance}")
        
        sequence = []
        generator = self.generate_step()
        
        try:
            while True:
                nail, info = next(generator)
                sequence.append(nail)
                
                # Print progress
                if info["line"] % 100 == 0:
                    if "remaining" in info:
                        print(f"Line {info['line']}/{info['total']} | "
                              f"Score: {info['score']:.2f} | "
                              f"Remaining: {info['remaining']:.1f}%")
                    else:
                        print(f"Line {info['line']}/{info['total']}")
        except StopIteration:
            pass
        
        print(f"\n✓ Generation complete! Generated {len(sequence)-1} lines")
        return sequence
    
    def save_results(self, sequence, output_prefix="string_art"):
        """Save sequence file and preview images"""
        # Save sequence
        seq_file = f"{output_prefix}_sequence.txt"
        with open(seq_file, 'w') as f:
            f.write(f"# String Art Sequence\n")
            f.write(f"# Nails: {self.n_nails}\n")
            f.write(f"# Lines: {len(sequence)-1}\n")
            f.write(f"# Thread Weight: {self.thread_weight:.3f}\n")
            f.write(f"# Min Distance: {self.min_distance}\n\n")
            for nail in sequence:
                f.write(f"{nail}\n")
        print(f"✓ Sequence saved to: {seq_file}")
        
        # Save preview image
        preview_file = f"{output_prefix}_preview.png"
        result_uint8 = np.clip(self.result_img, 0, 255).astype(np.uint8)
        cv2.imwrite(preview_file, result_uint8)
        print(f"✓ Preview saved to: {preview_file}")
        
        # Save comparison
        # Show: Original | Target (inverted) | Result
        original_display = cv2.cvtColor(self.img, cv2.COLOR_GRAY2BGR)
        result_display = cv2.cvtColor(result_uint8, cv2.COLOR_GRAY2BGR)
        
        comparison = np.hstack([original_display, result_display])
        comp_file = f"{output_prefix}_comparison.png"
        cv2.imwrite(comp_file, comparison)
        print(f"✓ Comparison saved to: {comp_file}")


def main():
    print("=" * 60)
    print("IMPROVED STRING ART GENERATOR")
    print("=" * 60)
    
    # Get image path
    img_path = input("\nEnter path to source image: ").strip().strip('"').strip("'")
    if not Path(img_path).exists():
        print(f"Error: Image not found at {img_path}")
        return
    
    # Get number of nails
    while True:
        try:
            n_nails = int(input("Enter number of nails (recommended: 200-300): "))
            if n_nails < 10:
                print("Please enter at least 10 nails")
                continue
            break
        except ValueError:
            print("Please enter a valid number")
    
    # Get max lines
    while True:
        try:
            max_lines = int(input("Enter maximum lines (recommended: 3000-5000): "))
            if max_lines < 100:
                print("Please enter at least 100 lines")
                continue
            break
        except ValueError:
            print("Please enter a valid number")
    
    # Get minimum nail distance
    while True:
        try:
            min_dist = int(input("Enter minimum nail distance (recommended: 15-25): "))
            if min_dist < 1:
                print("Please enter at least 1")
                continue
            break
        except ValueError:
            print("Please enter a valid number")
    
    print("\n" + "=" * 60)
    
    try:
        # Initialize generator
        start_time = time.time()
        generator = ImprovedStringArtGenerator(img_path, n_nails, max_lines, min_dist)
        
        # Generate string art
        sequence = generator.generate()
        
        # Save results
        output_prefix = Path(img_path).stem + "_stringart"
        generator.save_results(sequence, output_prefix)
        
        elapsed = time.time() - start_time
        print(f"\n✓ Total time: {elapsed:.2f} seconds")
        print(f"✓ Generated {len(sequence)-1} lines connecting {n_nails} nails")
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
