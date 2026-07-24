"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type Note = { id: string; text: string };

const initialNotes: Note[] = [
  { id: "nota-1", text: "Revisar contrato da Aurora" },
  { id: "nota-2", text: "Fechar lançamentos de julho" },
];

export function QuickNotes() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("nexo:quick-notes:v1");
    if (saved) {
      try {
        setNotes(JSON.parse(saved) as Note[]);
      } catch {
        window.localStorage.removeItem("nexo:quick-notes:v1");
      }
    }
  }, []);

  function persist(next: Note[]) {
    setNotes(next);
    window.localStorage.setItem("nexo:quick-notes:v1", JSON.stringify(next));
  }

  function addNote(event: FormEvent) {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    persist([...notes, { id: crypto.randomUUID(), text: value }]);
    setText("");
  }

  function startEdit(note: Note) {
    setEditing(note.id);
    setEditText(note.text);
  }

  function saveEdit() {
    const value = editText.trim();
    if (!editing || !value) return;
    persist(
      notes.map((note) =>
        note.id === editing ? { ...note, text: value } : note,
      ),
    );
    setEditing(null);
  }

  return (
    <aside className="flex min-h-[510px] flex-col rounded-panel border border-[#d5dbd5] bg-white/70 p-5 shadow-[0_1px_0_rgba(255,255,255,0.8)] sm:p-7">
      <h2 className="text-lg font-semibold tracking-[-0.025em]">
        Atalhos rápidos e lembretes
      </h2>

      <form className="mt-7" onSubmit={addNote}>
        <label className="sr-only" htmlFor="quick-note">
          Adicionar uma nota rápida
        </label>
        <textarea
          className="field-textarea min-h-[94px]"
          id="quick-note"
          onChange={(event) => setText(event.target.value)}
          placeholder="Adicionar uma nota rápida..."
          value={text}
        />
        <button className="primary-button mt-3 w-full" type="submit">
          <Plus size={16} />
          Adicionar
        </button>
      </form>

      <div className="mt-7 border-t border-[#dfe3df]">
        {notes.length ? (
          notes.map((note) => (
            <div
              className="flex min-h-[74px] items-center gap-3 border-b border-[#e3e7e3] py-3"
              key={note.id}
            >
              <span
                aria-hidden="true"
                className="h-8 w-1 shrink-0 rounded-full bg-[#9db2a2]"
              />
              {editing === note.id ? (
                <input
                  aria-label="Editar nota"
                  autoFocus
                  className="field-control h-9 min-w-0 flex-1"
                  onChange={(event) => setEditText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveEdit();
                    if (event.key === "Escape") setEditing(null);
                  }}
                  value={editText}
                />
              ) : (
                <span className="min-w-0 flex-1 text-[13px] leading-5 text-[#364039]">
                  {note.text}
                </span>
              )}
              {editing === note.id ? (
                <>
                  <button
                    aria-label="Salvar nota"
                    className="icon-button h-8 w-8 text-moss"
                    onClick={saveEdit}
                    type="button"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    aria-label="Cancelar edição"
                    className="icon-button h-8 w-8"
                    onClick={() => setEditing(null)}
                    type="button"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    aria-label={`Editar nota: ${note.text}`}
                    className="icon-button h-8 w-8"
                    onClick={() => startEdit(note)}
                    type="button"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    aria-label={`Excluir nota: ${note.text}`}
                    className="icon-button h-8 w-8 hover:text-coral"
                    onClick={() =>
                      persist(notes.filter((item) => item.id !== note.id))
                    }
                    type="button"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="py-9 text-center text-xs text-[#808a83]">
            Nenhuma nota por enquanto.
          </div>
        )}
      </div>
    </aside>
  );
}
