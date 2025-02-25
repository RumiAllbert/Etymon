import WordDeconstructor from "@/components/deconstructor";
import StructuredData from "@/components/structured-data";
import { Metadata, ResolvingMetadata } from "next";

// Update MetadataProps to use Promise for both params and searchParams
type MetadataProps = {
  params: Promise<{
    word: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(
  { params, searchParams }: MetadataProps,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { word } = await params;
  // We need to await searchParams even if we don't use it
  await searchParams;

  const decodedWord = decodeURIComponent(word);
  const capitalizedWord =
    decodedWord.charAt(0).toUpperCase() + decodedWord.slice(1).toLowerCase();

  return {
    title: `${capitalizedWord} Etymology - Word Origin and History | Etymon.ai`,
    description: `Explore the etymology and origins of "${decodedWord}". Learn about the historical roots, meanings, and evolution of "${decodedWord}" in an interactive visual format.`,
    keywords: `${decodedWord}, ${decodedWord} etymology, ${decodedWord} origin, ${decodedWord} meaning, ${decodedWord} history, word origins, etymology`,
    openGraph: {
      title: `${capitalizedWord} Etymology - Word Origin and History | Etymon.ai`,
      description: `Explore the etymology and origins of "${decodedWord}". Learn about the historical roots, meanings, and evolution of "${decodedWord}" in an interactive visual format.`,
    },
    twitter: {
      title: `${capitalizedWord} Etymology - Word Origin and History | Etymon.ai`,
      description: `Explore the etymology and origins of "${decodedWord}". Learn about the historical roots, meanings, and evolution of "${decodedWord}" in an interactive visual format.`,
    },
  };
}

// Define params as a Promise type for Next.js 15 compatibility
type Params = Promise<{ word: string }>;

// Make Page component async and await the params
export default async function Page({ params }: { params: Params }) {
  // Await the params to get the word value
  const { word } = await params;
  const decodedWord = decodeURIComponent(word);

  return (
    <main>
      <StructuredData word={decodedWord} />
      <WordDeconstructor word={decodedWord} />
    </main>
  );
}
