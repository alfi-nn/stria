import os
import sys
import numpy as np
import cv2
import base64
from flask import Flask, request, jsonify, send_file, Response, stream_with_context
from flask_cors import CORS
import io
import json

# Add parent directory to path to import StringArtGenerator
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from string_art_generator import ImprovedStringArtGenerator

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/api/generate', methods=['POST'])
def generate_art():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    n_nails = int(request.form.get('n_nails', 200))
    max_lines = int(request.form.get('max_lines', 4000))
    
    # Save uploaded file temporarily
    img_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(img_path)
    
    def generate_stream():
        try:
            # Initialize generator
            generator = ImprovedStringArtGenerator(img_path, n_nails, max_lines)
            
            # Step-by-step generation
            sequence = []
            gen_step = generator.generate_step()
            
            # First yield the randomly chosen start nail
            # (generate_step yields it first)
            
            for nail_data in gen_step:
                # generate_step yields (nail, info)
                if isinstance(nail_data, tuple):
                    nail, info = nail_data
                else:
                    nail = nail_data # Fallback if just nail
                
                # Convert numpy types to python native types for JSON serialization
                nail = int(nail)
                
                sequence.append(nail)
                # Yield current step
                yield json.dumps({'type': 'step', 'nail': nail}) + '\n'
            
            # Final result
            result_img = generator.result_img.astype(np.uint8)
            _, buffer = cv2.imencode('.png', result_img)
            img_str = base64.b64encode(buffer).decode('utf-8')
            
            yield json.dumps({
                'type': 'result',
                'image': f"data:image/png;base64,{img_str}",
                'sequence': sequence,
                'message': 'Generation successful'
            }) + '\n'
            
        except Exception as e:
            yield json.dumps({'type': 'error', 'error': str(e)}) + '\n'
            import traceback
            traceback.print_exc()
        finally:
            if os.path.exists(img_path):
                try:
                    os.remove(img_path)
                except:
                   pass

    return Response(stream_with_context(generate_stream()), mimetype='application/x-ndjson')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
