import {requireEmployee} from "@/lib/portal/auth";
export default async function QAPage() {
  await requireEmployee();
    return (
      <main
        style={{
          margin: 0,
          padding: 0,
          width: "100%",
          minHeight: "100vh",
          background: "#ffffff",
        }}
      >
        <iframe
          src="/qa/index.html"
          title="Q&A Workflow"
          style={{
            width: "100%",
            height: "100vh",
            border: "none",
            display: "block",
          }}
        />
      </main>
    );
  }
