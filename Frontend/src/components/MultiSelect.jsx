import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

export default function MultiSelect({ label, options, selected, setSelected }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef();

  const filtered = options.map(cat => ({
    ...cat,
    skills: cat.skills.filter(skill => skill.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.skills.length > 0);

  function toggleSkill(skill) {
    if (selected.includes(skill)) {
      setSelected(selected.filter(s => s !== skill));
    } else {
      setSelected([...selected, skill]);
    }
  }

  useEffect(() => {
    function handleClick(e) {
      if (inputRef.current && !inputRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="mb-2">
      <label className="block text-sm font-medium mb-1 text-white">{label}</label>
      <div className="relative" ref={inputRef}>
        <input
          className="w-full px-3 py-2 bg-[#232b32] text-white rounded border border-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search skills..."
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selected.map(skill => (
              <span key={skill} className="bg-blue-600 text-white rounded-full px-3 py-1 text-xs flex items-center gap-1">
                {skill}
                <button type="button" className="ml-1" onClick={e => { e.stopPropagation(); toggleSkill(skill); }}>×</button>
              </span>
            ))}
          </div>
        )}
        {open && (
          <div className="absolute z-20 bg-[#232b32] border border-gray-700 rounded mt-1 w-full max-h-64 overflow-y-auto shadow-lg">
            {filtered.length === 0 && <div className="p-3 text-gray-400 text-sm">No skills found</div>}
            {filtered.map(cat => (
              <div key={cat.label}>
                <div className="px-3 py-2 text-xs text-gray-400 font-semibold">{cat.label}</div>
                {cat.skills.map(skill => (
                  <label key={skill} className="flex items-center px-3 py-1 cursor-pointer hover:bg-blue-900/30">
                    <input
                      type="checkbox"
                      checked={selected.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                      className="accent-blue-500 mr-2"
                    />
                    <span className="text-white text-sm">{skill}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

MultiSelect.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      skills: PropTypes.arrayOf(PropTypes.string).isRequired
    })
  ).isRequired,
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  setSelected: PropTypes.func.isRequired
};
