// app/(public)/layout.tsx
export default async function PublicLayout({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <main className="min-h-[calc(100vh-4rem)]">
                {children}
            </main>
        </>
    );
}