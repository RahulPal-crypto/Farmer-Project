import { Link } from "react-router-dom";
import EmptyState from "../../components/EmptyState";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import ProductCard from "../../components/ProductCard";

function WishlistPage() {
  const { items: wishlistItems, itemCount, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveAllToCart = () => {
    wishlistItems.forEach((item) => {
      addToCart(item);
      removeFromWishlist(item._id);
    });
  };

  if (itemCount === 0) {
    return (
      <EmptyState
        title="Your Wishlist is Empty"
        description="Save your favorite seasonal crops, vegetables, and fruits to order them anytime."
        action={
          <Link
            to="/"
            className="rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-md hover:bg-emerald-700 transition"
          >
            Explore Fresh Harvest
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">My Saved Produce</h1>
          <p className="mt-1 text-sm text-slate-500">
            You have {itemCount} farm item{itemCount > 1 ? "s" : ""} saved in your wishlist.
          </p>
        </div>
        <button
          type="button"
          onClick={handleMoveAllToCart}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
        >
          <span>🛒</span>
          <span>Move All to Cart</span>
        </button>
      </div>

      <div className="grid gap-4 sm:gap-5.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {wishlistItems.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default WishlistPage;

