const Home = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Hero Section */}
      <section className="mt-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800">Master a new skill</h2>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search for skills"
            className="px-4 py-2 border rounded-lg w-1/3"
          />
          <button className="ml-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Start Learning
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;
