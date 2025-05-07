const Home = () => {
  return (
    <div className="min-h-screen font-poppins text-white p-6">
      {/* Hero Section */}
      <section className="mt-8 text-center">
        <h2 className="text-3xl font-bold text-white">Master a new skill</h2>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search for skills"
            className="px-4 py-2 border rounded-lg w-1/3 text-black"
          />
          <button className="ml-2 bg-secondary hover:bg-blue-700 text-white rounded-full px-6 py-2 font-semibold transition">
            Start Learning
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;
