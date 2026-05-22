import argparse
import base64
import io
import os
import sys
from pathlib import Path
from PIL import Image
from google import genai
from google.genai import types

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DISHES_ROOT = PROJECT_ROOT / 'public' / 'content' / 'dishes'
IMAGES_ROOT = PROJECT_ROOT / 'public' / 'images' / 'dishes'
PROMPT_PATH = PROJECT_ROOT / 'scripts' / 'prompt.md'

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--output-dir')
    parser.add_argument('--quality', type=int, default=92)
    parser.add_argument('--width', type=int)
    parser.add_argument('--height', type=int, default=2752)
    parser.add_argument('--model', default='gemini-3-pro-image-preview')
    return parser.parse_args()

def resolve_input_path(raw_path: str) -> Path:
    path = Path(raw_path)
    return path if path.is_absolute() else (PROJECT_ROOT / path)

def resolve_dish_info(input_path: Path):
    try:
        relative = input_path.relative_to(DISHES_ROOT)
        category = relative.parts[0]
    except Exception:
        parts = input_path.parts
        if 'dishes' in parts:
            idx = parts.index('dishes')
            category = parts[idx + 1] if idx + 1 < len(parts) else 'unknown'
        else:
            category = 'unknown'
    name = input_path.stem
    return category, name

def decode_inline_data(inline_data):
    data = getattr(inline_data, 'data', None)
    if data is None:
        return None
    if isinstance(data, bytes):
        return data
    if isinstance(data, str):
        return base64.b64decode(data)
    return bytes(data)

def extract_image_bytes(response):
    parts = getattr(response, 'parts', None)
    if parts:
        for part in parts:
            inline_data = getattr(part, 'inline_data', None)
            if inline_data:
                decoded = decode_inline_data(inline_data)
                if decoded:
                    return decoded
            if hasattr(part, 'as_image'):
                image = part.as_image()
                buf = io.BytesIO()
                image.save(buf, format='PNG')
                return buf.getvalue()
    candidates = getattr(response, 'candidates', None) or []
    for candidate in candidates:
        content = getattr(candidate, 'content', None)
        cparts = getattr(content, 'parts', []) if content else []
        for part in cparts:
            inline_data = getattr(part, 'inline_data', None)
            if inline_data:
                decoded = decode_inline_data(inline_data)
                if decoded:
                    return decoded
            if hasattr(part, 'as_image'):
                image = part.as_image()
                buf = io.BytesIO()
                image.save(buf, format='PNG')
                return buf.getvalue()
    raise RuntimeError('No image data found in model response')

def request_image(prompt: str, model: str, api_key: str):
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model,
        contents=[prompt],
        config=types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"],
            image_config=types.ImageConfig(
                aspect_ratio="9:16",
                image_size="2K",
            ),
        ),
    )
    return extract_image_bytes(response)

def resize_image(image: Image.Image, width: int | None, height: int | None):
    if not width and not height:
        return image
    if width and height:
        image.thumbnail((width, height), Image.Resampling.LANCZOS)
        return image
    if width:
        ratio = width / image.width
        return image.resize((width, int(image.height * ratio)), Image.Resampling.LANCZOS)
    ratio = height / image.height
    return image.resize((int(image.width * ratio), height), Image.Resampling.LANCZOS)

def save_jpeg(image_bytes: bytes, output_path: Path, quality: int, width: int | None, height: int | None):
    image = Image.open(io.BytesIO(image_bytes))
    image = resize_image(image, width, height)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image = image.convert('RGB')
    image.save(output_path, format='JPEG', quality=quality, optimize=True)

def main():
    args = parse_args()
    input_path = resolve_input_path(args.input)
    if not input_path.exists():
        print(f'Input file not found: {input_path}', file=sys.stderr)
        sys.exit(1)
    api_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
    if not api_key:
        print('Missing GEMINI_API_KEY (or GOOGLE_API_KEY) environment variable', file=sys.stderr)
        sys.exit(1)
    prompt_template = PROMPT_PATH.read_text(encoding='utf-8').strip()
    cook_content = input_path.read_text(encoding='utf-8').strip()
    prompt = prompt_template.replace('{{cook_content}}', cook_content)
    category, name = resolve_dish_info(input_path)
    output_root = Path(args.output_dir).resolve() if args.output_dir else IMAGES_ROOT
    output_path = output_root / category / f'{name}.jpeg'
    image_bytes = request_image(prompt, args.model, api_key)
    save_jpeg(image_bytes, output_path, args.quality, args.width, args.height)
    print(f'Generated image saved to {output_path}')

if __name__ == '__main__':
    main()
