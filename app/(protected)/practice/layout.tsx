import { PracticeTabs } from "@/components/practice-tabs";

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <PracticeTabs />
      {children}
    </section>
  );
}
