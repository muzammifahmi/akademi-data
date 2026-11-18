import { redirect } from "next/navigation";

export default function RedirectTambahPenggunaToSekolah() {
  redirect("/admin/sekolah");
}
