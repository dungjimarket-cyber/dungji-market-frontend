'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import { FontSize } from '@/lib/tiptap/fontSize';
import {
  Bold, Italic, List, ListOrdered, Undo, Redo, Link as LinkIcon, Palette, Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = '내용을 입력하세요',
  maxLength = 5000
}: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,  // Disable Link from StarterKit to avoid duplicate
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      TextStyle,
      Color,
      FontSize,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      if (text.length <= maxLength) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const url = window.prompt('URL을 입력하세요:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const colors = [
    '#000000', '#374151', '#6B7280', '#9CA3AF',
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  ];

  const currentLength = editor.getText().length;
  const isMaxLength = currentLength >= maxLength;

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden">
      {/* 툴바 */}
      <div className="border-b border-slate-200 bg-slate-50 p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8 p-0"
        >
          <Bold className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-8 w-8 p-0"
        >
          <Italic className="w-4 h-4" />
        </Button>

        <div className="w-px h-8 bg-slate-300 mx-1" />

        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-8 w-8 p-0"
        >
          <List className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        <div className="w-px h-8 bg-slate-300 mx-1" />

        <Button
          type="button"
          variant={editor.isActive('link') ? 'default' : 'ghost'}
          size="sm"
          onClick={setLink}
          className="h-8 w-8 p-0"
        >
          <LinkIcon className="w-4 h-4" />
        </Button>

        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFontSizePicker(!showFontSizePicker)}
            className="h-8 w-8 p-0"
          >
            <Type className="w-4 h-4" />
          </Button>

          {showFontSizePicker && (
            <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-50 min-w-[120px]">
              {['12px', '14px', '16px', '18px', '20px', '24px', '28px'].map((size) => (
                <button
                  key={size}
                  type="button"
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 rounded text-sm"
                  style={{ fontSize: size }}
                  onClick={() => {
                    editor.chain().focus().setFontSize(size).run();
                    setShowFontSizePicker(false);
                  }}
                >
                  {size}
                </button>
              ))}
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 rounded text-xs text-slate-600 mt-1 border-t"
                onClick={() => {
                  editor.chain().focus().unsetFontSize().run();
                  setShowFontSizePicker(false);
                }}
              >
                기본 크기
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="h-8 w-8 p-0"
          >
            <Palette className="w-4 h-4" />
          </Button>

          {showColorPicker && (
            <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-50">
              <div className="grid grid-cols-5 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border border-slate-300 hover:scale-110 transition"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                className="mt-2 w-full text-xs text-slate-600 hover:text-slate-900"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setShowColorPicker(false);
                }}
              >
                색상 제거
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-slate-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
        >
          <Undo className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
        >
          <Redo className="w-4 h-4" />
        </Button>

        <div className="ml-auto flex items-center">
          <span className={`text-xs ${isMaxLength ? 'text-red-600' : 'text-slate-500'}`}>
            {currentLength}/{maxLength}
          </span>
        </div>
      </div>

      {/* 에디터 */}
      <EditorContent editor={editor} />
    </div>
  );
}