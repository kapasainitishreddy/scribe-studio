import React, { useState } from "react";
import {
  BookOpen,
  Lock,
  Unlock,
  Plus,
  Shield,
  User,
  MapPin,
  Package,
  Key,
  HelpCircle,
  CheckCircle,
  Flame
} from "lucide-react";
import type { CanonFact, CanonFactCategory, CanonFactStatus, Project } from "../../packages/project-model/src/types";

interface StoryBiblePanelProps {
  project: Project;
  onUpdateCanonFact: (fact: CanonFact) => void;
  onAddCanonFact: (fact: Omit<CanonFact, "id" | "createdAt" | "updatedAt">) => void;
}

export const StoryBiblePanel: React.FC<StoryBiblePanelProps> = ({
  project,
  onUpdateCanonFact,
  onAddCanonFact
}) => {
  const [activeCategory, setActiveCategory] = useState<CanonFactCategory | "all">("all");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("maya-lin");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStatement, setNewStatement] = useState("");
  const [newCategory, setNewCategory] = useState<CanonFactCategory>("world-rule");
  const [newStatus, setNewStatus] = useState<CanonFactStatus>("approved");

  const filteredFacts = project.canon.filter(
    (f) => activeCategory === "all" || f.category === activeCategory
  );

  const selectedCharacter = project.characters[selectedCharacterId];

  const handleCreateFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStatement.trim()) return;
    onAddCanonFact({
      title: newTitle.trim(),
      statement: newStatement.trim(),
      category: newCategory,
      status: newStatus,
      locked: newStatus === "locked",
      sourceLineIds: []
    });
    setNewTitle("");
    setNewStatement("");
    setIsAddOpen(false);
  };

  const toggleFactLock = (fact: CanonFact) => {
    onUpdateCanonFact({
      ...fact,
      locked: !fact.locked,
      status: !fact.locked ? "locked" : "approved"
    });
  };

  return (
    <div className="flex-1 flex h-full bg-[#0c0d10] overflow-hidden select-none">
      {/* Left Column: Canon Categories & Characters List */}
      <aside className="w-72 border-r border-[#232730] bg-[#111319] flex flex-col overflow-hidden">
        <div className="p-3 border-b border-[#232730] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200">CANON CATEGORIES</span>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="p-1 bg-[#1a1e29] hover:bg-[#252a38] text-slate-300 rounded border border-[#2e3547]"
            title="Add Canon Fact"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-2 space-y-1 text-xs border-b border-[#232730]">
          {[
            { id: "all", label: "All Canon Facts", count: project.canon.length },
            { id: "world-rule", label: "World Rules", count: project.canon.filter((f) => f.category === "world-rule").length },
            { id: "secret", label: "Secrets & Mysteries", count: project.canon.filter((f) => f.category === "secret").length },
            { id: "prop", label: "Props & Key Objects", count: project.canon.filter((f) => f.category === "prop").length },
            { id: "character", label: "Character Facts", count: project.canon.filter((f) => f.category === "character").length }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition-colors ${
                activeCategory === cat.id
                  ? "bg-[#222836] text-white font-medium border border-[#353d52]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#161922]"
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-[10px] bg-[#101217] px-1.5 py-0.5 rounded font-mono text-slate-400">
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Character Dossiers Navigation */}
        <div className="p-3 border-b border-[#232730] text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
          <User className="w-3.5 h-3.5 text-indigo-400" />
          <span>CHARACTER DOSSIERS</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {Object.values(project.characters).map((char) => {
            const isSelected = selectedCharacterId === char.id;
            return (
              <button
                key={char.id}
                onClick={() => setSelectedCharacterId(char.id)}
                className={`w-full text-left p-2 rounded text-xs transition-all ${
                  isSelected
                    ? "bg-indigo-950/40 border border-indigo-500/40 text-indigo-200"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#161922] border border-transparent"
                }`}
              >
                <div className="font-semibold text-slate-200">{char.name}</div>
                <div className="text-[11px] text-slate-400 truncate capitalize">{char.role} Character</div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Center & Right: Canon Facts Ledger & Character Dossier View */}
      <main className="flex-1 flex overflow-hidden">
        {/* Canon Facts Ledger */}
        <div className="flex-1 flex flex-col border-r border-[#232730] overflow-hidden">
          <div className="h-10 border-b border-[#232730] bg-[#14161d] px-4 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">
              STORY CANON FACTS ({filteredFacts.length})
            </span>
            <span className="text-slate-400 text-[11px]">
              Locked facts cannot be silently rewritten by AI agents
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredFacts.map((fact) => (
              <div
                key={fact.id}
                className="bg-[#14161e] border border-[#262b3a] rounded-lg p-3 hover:border-[#384055] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-200">{fact.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                        fact.status === "locked"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : fact.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {fact.status}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize bg-[#1c202a] px-1.5 py-0.5 rounded">
                      {fact.category}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleFactLock(fact)}
                    className={`p-1 rounded border transition-colors ${
                      fact.locked
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30"
                        : "bg-[#1c202a] text-slate-400 border-[#2f3547] hover:text-slate-200"
                    }`}
                    title={fact.locked ? "Fact is Locked Ground Truth" : "Lock this Canon Fact"}
                  >
                    {fact.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-300 leading-relaxed font-sans">{fact.statement}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Character Dossier Inspector */}
        {selectedCharacter && (
          <aside className="w-96 bg-[#11131a] flex flex-col overflow-y-auto p-4 border-l border-[#232730]">
            <div className="flex items-center space-x-2 pb-3 border-b border-[#232730]">
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300">
                {selectedCharacter.name[0]}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">{selectedCharacter.name}</h3>
                <span className="text-xs text-indigo-400 font-medium capitalize">
                  {selectedCharacter.role}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Biography & Background
                </label>
                <p className="mt-1 text-slate-300 leading-relaxed">{selectedCharacter.biography}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Dramatic Objective
                </label>
                <p className="mt-1 text-amber-300 font-medium">{selectedCharacter.dramaticObjective}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Voice & Speaking Style
                </label>
                <p className="mt-1 text-slate-300 font-mono bg-[#161922] p-2 rounded border border-[#272c3b]">
                  {selectedCharacter.speakingStyle}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Character Traits
                </label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {selectedCharacter.traits.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-indigo-950/50 text-indigo-300 border border-indigo-500/30 text-[11px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Wardrobe & Physical Notes
                </label>
                <p className="mt-1 text-slate-300">{selectedCharacter.wardrobeNotes}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Scene-by-Scene Knowledge Tracking
                </label>
                <div className="mt-2 space-y-2">
                  {Object.entries(selectedCharacter.knowledgeByScene).map(([sNum, facts]) => (
                    <div key={sNum} className="p-2 rounded bg-[#161924] border border-[#272d3e]">
                      <div className="font-bold text-amber-400 text-[11px]">SCENE {sNum}</div>
                      <ul className="mt-1 space-y-1">
                        {facts.map((f, i) => (
                          <li key={i} className="text-slate-300 text-[11px] flex items-start space-x-1.5">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* Add Canon Fact Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateFact}
            className="bg-[#151720] border border-[#2d3447] rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#262c3d] pb-3">
              <h3 className="text-sm font-bold text-slate-200">Create Canon Fact</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Vault 7 Magnetic Lock Timeout"
                className="w-full bg-[#1c202c] border border-[#2d3447] rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full bg-[#1c202c] border border-[#2d3447] rounded px-3 py-1.5 text-xs text-slate-200 outline-none"
              >
                <option value="world-rule">World Rule</option>
                <option value="prop">Prop</option>
                <option value="secret">Secret</option>
                <option value="character">Character</option>
                <option value="location">Location</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Factual Statement</label>
              <textarea
                value={newStatement}
                onChange={(e) => setNewStatement(e.target.value)}
                rows={4}
                placeholder="Describe the inviolable ground truth..."
                className="w-full bg-[#1c202c] border border-[#2d3447] rounded p-3 text-xs text-slate-200 outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#262c3d]">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold"
              >
                Add to Canon
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
