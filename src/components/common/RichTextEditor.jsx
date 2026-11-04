import { useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import toast from 'react-hot-toast';
import 'react-quill-new/dist/quill.snow.css';
import 'react-quill-new/dist/quill.bubble.css';
import { uploadFiles, assetUrl, errorMessage } from '../../services/portalService';

const TOOLBAR = [
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ 'color': [] }, { 'background': [] }],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'indent': '-1'}, { 'indent': '+1' }],
  [{ 'align': [] }],
  ['blockquote', 'code-block'],
  ['link', 'image'],
  ['clean']
];

const FORMATS = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet',
  'indent',
  'align',
  'blockquote', 'code-block',
  'link', 'image'
];

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

// Tải ảnh lên Cloudinary rồi chèn URL vào nội dung (mặc định Quill nhúng base64 vào HTML)
const insertImages = async (quill, files, index) => {
  const images = Array.from(files).filter((f) => IMAGE_TYPES.includes(f.type));
  if (!images.length) return;
  const toastId = toast.loading(`Đang tải ${images.length} ảnh lên...`);
  try {
    const uploaded = await uploadFiles(images);
    uploaded.forEach((file, i) => quill.insertEmbed(index + i, 'image', assetUrl(file.fileUrl), 'user'));
    quill.setSelection(index + uploaded.length, 0, 'user');
    toast.success('Đã chèn ảnh', { id: toastId });
  } catch (error) {
    toast.error(errorMessage(error, 'Tải ảnh thất bại'), { id: toastId });
  }
};

const RichTextEditor = ({ value, onChange, placeholder, height = 200 }) => {
  // Giữ modules ổn định giữa các lần render, nếu không Quill sẽ khởi tạo lại
  const modules = useMemo(() => ({
    toolbar: {
      container: TOOLBAR,
      handlers: {
        image() {
          const quill = this.quill;
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = IMAGE_TYPES.join(',');
          input.multiple = true;
          input.onchange = () => insertImages(quill, input.files, quill.getSelection(true).index);
          input.click();
        }
      }
    },
    // Kéo thả / dán ảnh
    uploader: {
      mimetypes: IMAGE_TYPES,
      handler(range, files) {
        insertImages(this.quill, files, range.index);
      }
    }
  }), []);

  return (
    <div className="rich-text-editor" style={{ marginBottom: '1rem' }}>
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder || 'Nhập nội dung...'}
        style={{ height: `${height}px` }}
      />
    </div>
  );
};

export default RichTextEditor;
