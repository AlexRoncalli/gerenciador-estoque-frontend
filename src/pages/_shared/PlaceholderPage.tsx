interface PlaceholderPageProps {
  name: string;
}

// Removemos a importação de CSS e o className da div
export function PlaceholderPage({ name }: PlaceholderPageProps) {
  return (
    <div>
      <h2>Tela {name} em desenvolvimento...</h2>
    </div>
  );
}