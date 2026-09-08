export default async function ServerTestPage() {
  const data = await fetch("https://jsonplaceholder.typicode.com/todos/1").then(
    (response) => response.json()
  )

  return (
    <main className="flex min-h-svh justify-center px-6 py-16 sm:items-center">
      <h1>Server Test: {data.title}</h1>
    </main>
  )
}
