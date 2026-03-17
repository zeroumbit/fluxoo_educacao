import React, { useRef, useEffect, useState } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Atualiza o conteúdo do editor apenas se o valor externo mudar E for diferente do conteúdo atual
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const ToolbarButton = ({ 
    icon: Icon, 
    command, 
    value = '' 
  }: { 
    icon: any, 
    command: string, 
    value?: string 
  }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-md hover:bg-zinc-100 text-zinc-600"
      onClick={(e) => {
        e.preventDefault()
        execCommand(command, value)
      }}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )

  return (
    <div className={cn("flex flex-col border border-zinc-200 rounded-xl overflow-hidden bg-white", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-50 border-b border-zinc-200">
        <ToolbarButton icon={Bold} command="bold" />
        <ToolbarButton icon={Italic} command="italic" />
        <ToolbarButton icon={Underline} command="underline" />
        <div className="w-px h-4 bg-zinc-300 mx-1" />
        <ToolbarButton icon={List} command="insertUnorderedList" />
        <ToolbarButton icon={ListOrdered} command="insertOrderedList" />
        <div className="w-px h-4 bg-zinc-300 mx-1" />
        <ToolbarButton icon={AlignLeft} command="justifyLeft" />
        <ToolbarButton icon={AlignCenter} command="justifyCenter" />
        <ToolbarButton icon={AlignRight} command="justifyRight" />
        <div className="w-px h-4 bg-zinc-300 mx-1" />
        <select 
          className="text-xs font-semibold bg-white border border-zinc-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
          onChange={(e) => execCommand('formatBlock', e.target.value)}
          defaultValue="P"
        >
          <option value="P">Texto</option>
          <option value="H1">Título 1</option>
          <option value="H2">Título 2</option>
          <option value="H3">Título 3</option>
          <option value="BLOCKQUOTE">Citação</option>
        </select>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="flex-1 p-12 min-h-[700px] focus:outline-none font-serif text-zinc-800 leading-[1.4] overflow-y-auto bg-white"
        style={{
            outline: 'none',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
        }}
        spellCheck={false}
      />
      
      <style dangerouslySetInnerHTML={{ __html: `
        [contenteditable] p { margin-bottom: 0.5em; }
        [contenteditable] h1 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.8em; margin-top: 1em; line-height: 1.2; }
        [contenteditable] h2 { font-size: 1.25em; font-weight: bold; margin-bottom: 0.6em; margin-top: 0.8em; }
        [contenteditable] h3 { font-size: 1.1em; font-weight: bold; margin-bottom: 0.4em; }
        [contenteditable] ul, [contenteditable] ol { margin-bottom: 1em; padding-left: 1.5em; }
      `}} />
      
      {/* Footer Info */}
      <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center">
        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider italic">
          O conteúdo é salvo automaticamente como HTML seguro
        </p>
        <div className="flex items-center gap-2">
            <Type className="h-3 w-3 text-zinc-300" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Modo Visual</span>
        </div>
      </div>
    </div>
  )
}
