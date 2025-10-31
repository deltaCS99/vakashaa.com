// components/blog/blog-post-content.tsx
interface BlogPostContentProps {
  post: {
    content: string;
  };
}

export function BlogPostContent({ post }: BlogPostContentProps) {
  return (
    <div
      className="prose prose-lg max-w-none
        prose-headings:font-bold prose-headings:text-gray-900
        prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
        prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-gray-900 prose-strong:font-semibold
        prose-ul:my-4 prose-ol:my-4
        prose-li:text-gray-700 prose-li:my-1
        prose-img:rounded-lg prose-img:shadow-md
        prose-blockquote:border-l-4 prose-blockquote:border-primary 
        prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600"
      dangerouslySetInnerHTML={{ __html: post.content }}
    />
  );
}