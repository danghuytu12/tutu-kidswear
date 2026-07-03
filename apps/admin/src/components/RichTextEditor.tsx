"use client";

import { Editor } from "@tinymce/tinymce-react";

// TinyMCE rich-text editor (CDN build). The API key comes from
// NEXT_PUBLIC_TINYMCE_API_KEY — get a free key at https://www.tiny.cloud.
// With a placeholder key the editor still works but shows a domain warning.
const API_KEY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY ?? "no-api-key";

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  return (
    <Editor
      apiKey={API_KEY}
      value={value}
      onEditorChange={(html) => onChange(html)}
      init={{
        height: 320,
        menubar: false,
        plugins: [
          "advlist",
          "autolink",
          "lists",
          "link",
          "image",
          "charmap",
          "preview",
          "anchor",
          "searchreplace",
          "visualblocks",
          "code",
          "fullscreen",
          "insertdatetime",
          "media",
          "table",
          "wordcount",
        ],
        toolbar:
          "undo redo | blocks | bold italic underline forecolor | " +
          "alignleft aligncenter alignright | bullist numlist outdent indent | " +
          "link image table | removeformat | code fullscreen",
        content_style:
          "body { font-family: Outfit, Helvetica, Arial, sans-serif; font-size: 14px }",
      }}
    />
  );
}
