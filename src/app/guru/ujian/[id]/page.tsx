"use client";

import { useParams } from "next/navigation";
import ExamBuilder from "../ExamBuilder";

export default function EditUjianPage() {
  const params = useParams();
  const id = params?.id as string;
  return <ExamBuilder ujianId={id} />;
}
