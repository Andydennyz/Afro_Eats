import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import BlogLayout from "./pages/blog/layout.tsx";
import PostPage from "./pages/blog/post/page.tsx";
import CategoryPage from "./pages/blog/category/page.tsx";
import SearchPage from "./pages/blog/search/page.tsx";
import AdminLayout from "./pages/admin/layout.tsx";
import AdminDashboard from "./pages/admin/page.tsx";
import AdminPostEditor from "./pages/admin/editor/page.tsx";

import BookmarksPage from "./pages/bookmarks/page.tsx";
import ProfilePage from "./pages/profile/page.tsx";

import TagPage from "./pages/blog/tag/page.tsx";

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route element={<BlogLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/post/:slug" element={<PostPage />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/tag/:tag" element={<TagPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="editor" element={<AdminPostEditor />} />
            <Route path="editor/:id" element={<AdminPostEditor />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
