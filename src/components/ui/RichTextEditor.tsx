import React, { useEffect, useRef } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Type,
  Underline,
  type LucideIcon,
} from 'lucide-react'
import DOMPurify from 'dompurify'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

interface ToolbarButtonProps {
  icon: LucideIcon
  command: string
  value?: string
  onExecute: (command: string, value?: string) => void
}

function ToolbarButton({
  icon: Icon,
  command,
  value = '',
  onExecute,
}: ToolbarButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-md hover:bg-zinc-100 text-zinc-600"
      onClick={(event) => {
        event.preventDefault()
        onExecute(command, value)
      }}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const sanitizedValue = DOMPurify.sanitize(value)
    if (sanitizedValue !== editor.innerHTML) {
      editor.innerHTML = sanitizedValue
    }
  }, [value])

  const emitChange = () => {
    const editor = editorRef.current
    if (editor) {
      onChange(DOMPurify.sanitize(editor.innerHTML))
    }
  }

  const execCommand = (command: string, commandValue: string = '') => {
    document.execCommand(command, false, commandValue)
    emitChange()
  }

  return (
    <div className={cn('flex flex-col border border-zinc-200 rounded-xl overflow-hidden bg-white', className)}>
      <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-50 border-b border-zinc-200">
        <ToolbarButton icon={Bold} command="bold" onExecute={execCommand} />
        <ToolbarButton icon={Italic} command="italic" onExecute={execCommand} />
        <ToolbarButton icon={Underline} command="underline" onExecute={execCommand} />
        <div className="w-px h-4 bg-zinc-300 mx-1" />
        <ToolbarButton icon={List} command="insertUnorderedList" onExecute={execCommand} />
        <ToolbarButton icon={ListOrdered} command="insertOrderedList" onExecute={execCommand} />
        <div className="w-px h-4 bg-zinc-300 mx-1" />
        <ToolbarButton icon={AlignLeft} command="justifyLeft" onExecute={execCommand} />
        <ToolbarButton icon={AlignCenter} command="justifyCenter" onExecute={execCommand} />
        <ToolbarButton icon={AlignRight} command="justifyRight" onExecute={execCommand} />
        <div className="w-px h-4 bg-zinc-300 mx-1" />
        <select
          className="text-xs font-semibold bg-white border border-zinc-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
          onChange={(event) => execCommand('formatBlock', event.target.value)}
          defaultValue="P"
        >
          <option value="P">Texto</option>
          <option value="H1">Titulo 1</option>
          <option value="H2">Titulo 2</option>
          <option value="H3">Titulo 3</option>
          <option value="BLOCKQUOTE">Citacao</option>
        </select>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={emitChange}
        className="flex-1 p-12 min-h-[700px] focus:outline-none font-serif text-zinc-800 leading-[1.4] overflow-y-auto bg-white"
        style={{
          outline: 'none',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
        spellCheck={false}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
            [contenteditable] p { margin-bottom: 0.5em; }
            [contenteditable] h1 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.8em; margin-top: 1em; line-height: 1.2; }
            [contenteditable] h2 { font-size: 1.25em; font-weight: bold; margin-bottom: 0.6em; margin-top: 0.8em; }
            [contenteditable] h3 { font-size: 1.1em; font-weight: bold; margin-bottom: 0.4em; }
            [contenteditable] ul, [contenteditable] ol { margin-bottom: 1em; padding-left: 1.5em; }
          `,
        }}
      />

      <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center">
        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider italic">
          O conteudo e salvo automaticamente como HTML seguro
        </p>
        <div className="flex items-center gap-2">
          <Type className="h-3 w-3 text-zinc-300" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
            Modo Visual
          </span>
        </div>
      </div>
    </div>
  )
}
