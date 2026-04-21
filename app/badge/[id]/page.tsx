import { Metadata } from "next";
import { BadgePrintClient } from "./BadgePrintClient";

export const metadata: Metadata = {
  title: "Badge | EventFlow",
};

export default function BadgePage({ params }: { params: { id: string } }) {
  return <BadgePrintClient id={params.id} />;
}
