import { useEffect, useRef } from 'react';
export function AutoSubmitForm({ url, fields, method = 'POST' }: { url: string; fields: Record<string, string>; method?: 'POST' | 'GET' }) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { formRef.current?.submit(); }, []);
  return (
    <form ref={formRef} method={method} action={url}>
      {Object.entries(fields).map(([k, v]) => (<input key={k} type="hidden" name={k} value={v} />))}
      <noscript><button type="submit">Continue</button></noscript>
    </form>
  );
}