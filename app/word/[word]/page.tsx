import WordDeconstructor from "@/components/deconstructor";
import StructuredData from "@/components/structured-data";
import { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: { word: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const word = decodeURIComponent(params.word);
  const capitalizedWord =
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

  return {
    title: `${capitalizedWord} Etymology - Word Origin and History | Etymon.ai`,
    description: `Explore the etymology and origins of "${word}". Learn about the historical roots, meanings, and evolution of "${word}" in an interactive visual format.`,
    keywords: `${word}, ${word} etymology, ${word} origin, ${word} meaning, ${word} history, word origins, etymology`,
    openGraph: {
      title: `${capitalizedWord} Etymology - Word Origin and History | Etymon.ai`,
      description: `Explore the etymology and origins of "${word}". Learn about the historical roots, meanings, and evolution of "${word}" in an interactive visual format.`,
    },
    twitter: {
      title: `${capitalizedWord} Etymology - Word Origin and History | Etymon.ai`,
      description: `Explore the etymology and origins of "${word}". Learn about the historical roots, meanings, and evolution of "${word}" in an interactive visual format.`,
    },
  };
}

export default function WordPage({ params }: Props) {
  const word = decodeURIComponent(params.word);

  return (
    <main>
      <StructuredData word={word} />
      <WordDeconstructor word={word} />
    </main>
  );
}
