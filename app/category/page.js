"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import "../styles/category/CategoriesPage.css";

export default function CategoriesPage() {
  const router = useRouter();
  const ADMIN = 5;
  const ORGANIZER = 6;

  const [categories, setCategories] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState([]);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (token) {
        const res = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setRole(data.user?.role_id || null);
      }

      const catRes = await fetch("/api/categories/get");
      const catData = await catRes.json();
      setCategories(catData.categories || []);
    } catch (err) {
      console.error("Init error:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryClick(catId) {
    router.push(`/category/events?category_id=${catId}`);
  }

  function handleCreateCategory() {
    router.push("/category/create");
  }

  function handleEditCategory(catId) {
    router.push(`/category/edit/${catId}`);
  }

  async function handleDeleteCategory(catId) {
    if (!confirm("Delete this category?")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/categories/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: catId }),
      });

      const result = await res.json();
      if (res.ok) setCategories(prev => prev.filter(c => c.id !== catId));
      else alert(result.error || "Delete failed");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed");
    }
  }

  function toggleDescription(catId) {
    setExpandedIds(prev =>
      prev.includes(catId)
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    );
  }

  if (loading) return <p className="categories-loading">Loading categories...</p>;

  return (
    <div className="categories-container">
      <div className="categories-header">
        <h1 className="categories-title">Categories</h1>

        {(role === ADMIN || role === ORGANIZER) && (
          <button
            onClick={handleCreateCategory}
            className="categories-create-button"
          >
            Create Category
          </button>
        )}
      </div>

      <div className="categories-grid">
        {categories.length === 0 ? (
          <p className="categories-empty">No categories found.</p>
        ) : (
          categories.map(cat => {
            const isExpanded = expandedIds.includes(cat.id);

            return (
              <div key={cat.id} className="category-card">
                {cat.image && (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="category-image"
                  />
                )}

                <h2
                  onClick={() => handleCategoryClick(cat.id)}
                  className="category-name"
                >
                  {cat.name}
                </h2>

                {/* ✅ Description */}
                <div className="category-description-wrapper">
                  <p className={`category-description ${isExpanded ? "expanded" : ""}`}>
                    {cat.description}
                  </p>

                  {cat.description?.length > 80 && (
                    <span
                      onClick={() => toggleDescription(cat.id)}
                      className="show-more-text"
                    >
                      {isExpanded ? "Show Less" : "Show More"}
                    </span>
                  )}
                </div>

                {(role === ADMIN || role === ORGANIZER) && (
                  <div className="category-actions">
                    <button
                      onClick={() => handleEditCategory(cat.id)}
                      className="category-edit-button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="category-delete-button"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}