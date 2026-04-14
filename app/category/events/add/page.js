"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import styles from "../../../styles/event/createEvent.module.css";

export default function AddEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category_id");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [regularEarly, setRegularEarly] = useState("");
  const [regularRound2, setRegularRound2] = useState("");
  const [regularRound3, setRegularRound3] = useState("");

  const [earlyEnd, setEarlyEnd] = useState("");
  const [round2End, setRound2End] = useState("");
  const [round3End, setRound3End] = useState("");

  const [priceVIP, setPriceVIP] = useState("");
  const [priceVVIP, setPriceVVIP] = useState("");

  const [date, setDate] = useState("");
  const [ticketLimit, setTicketLimit] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    if (!categoryId) {
      alert("No category selected");
      router.push("/category");
      return;
    }

    loadUser();
    loadCategoryName();
  }, [categoryId]);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("id, role_id")
      .eq("auth_id", user.id)
      .single();

    if (!data) return;

    setUserId(data.id);
    setUserRole(data.role_id);

    if (![5, 6].includes(data.role_id)) {
      alert("No permission");
      router.push("/category");
    }
  }

  async function loadCategoryName() {
    const { data } = await supabase
      .from("categories")
      .select("name")
      .eq("id", categoryId)
      .single();

    if (data) setCategoryName(data.name);
  }

  async function handleCreateEvent(e) {
    e.preventDefault();

    if (!title || !date || !ticketLimit) {
      alert("Please fill required fields");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert("Not authenticated");
        return;
      }

      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          user_role: userRole,
          title,
          description,
          location,

          // ✅ FIXED STRUCTURE (IMPORTANT)
          price_regular_stages: {
            early: { price: parseFloat(regularEarly) || 0 },
            round2: { price: parseFloat(regularRound2) || 0 },
            round3: { price: parseFloat(regularRound3) || 0 },
          },

          end_date_stages: {
            early: earlyEnd || null,
            round2: round2End || null,
            round3: round3End || null,
          },

          price_vip: parseFloat(priceVIP) || 0,
          price_vvip: parseFloat(priceVVIP) || 0,

          date,
          category_id: parseInt(categoryId),
          image_url: imageUrl || null,
          ticket_limit: parseInt(ticketLimit) || 0,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Failed to create event");
        return;
      }

      router.push(`/category/events?category_id=${categoryId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles["event-add-container"]}>
      <h1 className={styles["event-add-title"]}>
        Create Event in {categoryName}
      </h1>

      <form onSubmit={handleCreateEvent} className={styles["event-add-form"]}>
        
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        {/* PRICES */}
        <h3>Prices</h3>
        <input type="number" placeholder="Early" value={regularEarly} onChange={(e) => setRegularEarly(e.target.value)} />
        <input type="number" placeholder="Round 2" value={regularRound2} onChange={(e) => setRegularRound2(e.target.value)} />
        <input type="number" placeholder="Round 3" value={regularRound3} onChange={(e) => setRegularRound3(e.target.value)} />

        {/* END DATES */}
        <h3>End Dates</h3>
        <input type="date" value={earlyEnd} onChange={(e) => setEarlyEnd(e.target.value)} />
        <input type="date" value={round2End} onChange={(e) => setRound2End(e.target.value)} />
        <input type="date" value={round3End} onChange={(e) => setRound3End(e.target.value)} />

        {/* VIP / VVIP */}
        <h3>VIP / VVIP</h3>
        <input type="number" placeholder="VIP" value={priceVIP} onChange={(e) => setPriceVIP(e.target.value)} />
        <input type="number" placeholder="VVIP" value={priceVVIP} onChange={(e) => setPriceVVIP(e.target.value)} />

        {/* EVENT INFO */}
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="number" placeholder="Ticket Limit" value={ticketLimit} onChange={(e) => setTicketLimit(e.target.value)} />
        <input placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Event"}
        </button>
      </form>
    </div>
  );
}