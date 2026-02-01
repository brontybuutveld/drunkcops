import React from "react";

export function ImportGraph({ onGraphSubmit }: { onGraphSubmit: (graph: string) => void }) {
  async function helper (e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (file)
      return (await file.text()).trim();
    else
      return "";
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    const foo = await helper(e);
    onGraphSubmit(foo);
  }

  return (
    <form>
      <input type="file" onChange={handleFileChange} />
    </form>
  );
}
