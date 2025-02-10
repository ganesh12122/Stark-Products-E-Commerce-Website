import React from 'react';
import { Editor } from '@tinymce/tinymce-react';

const ProductDescriptionEditor = ({ onChange }: { onChange: (content: string) => void }) => {
  return (
    <Editor
      apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
      init={{
        height: 500,
        menubar: false,
        plugins: [
          'advlist autolink lists link image charmap print preview anchor',
          'searchreplace visualblocks code fullscreen',
          'insertdatetime media table paste code help wordcount'
        ],
        toolbar:
          'undo redo | formatselect | bold italic backcolor | \
          alignleft aligncenter alignright alignjustify | \
          bullist numlist outdent indent | removeformat | help'
      }}
      onEditorChange={onChange}
    />
  );
};

export default ProductDescriptionEditor; 