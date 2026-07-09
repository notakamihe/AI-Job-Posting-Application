import { getSkills } from "@/actions/api/skill";
import { Skill } from "@/types";
import { debounce } from "@/utils/utils";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa";

interface SkillsFormProps {
  dropdown?: boolean;
  onAdd: (skill: Skill) => void;
  skills: Skill[];
  size?: "sm" | "md";
}

export default function SkillSearch({ dropdown, onAdd, skills, size }: SkillsFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [searchResults, setSearchResults] = useState<Skill[]>([]);
  const [text, setText] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const textRef = useRef(text);

  const existingSkill = skills.find(skill => skill.name.toLowerCase() === text.toLowerCase());
  const existingSkillInSearchResults = searchResults.find(skill => skill.name.toLowerCase() === text.toLowerCase());

  useEffect(() => {
    textRef.current = text;

    setIsPending(true);

    if (!text.trim()) {
      setSearchResults([]);
      setIsPending(false);
      return;
    }

    search(text);
  }, [text, skills]);

  const search = useCallback(
    debounce((term: string) => {
      getSkills({ contains: term, exclude: skills.map(skill => skill.name), limit: 3 })
        .then(results => {
          if (textRef.current.trim() === term.trim()) {
            setSearchResults(results);
            setIsPending(false);
          }
        });
    }, 350),
    [skills]
  );

  function addSkill(skill?: Skill) {
    if (!skill) {
      if (dropdown) {
        if (searchResults.length > 0)
          skill = searchResults[0];
      } else {
        if (existingSkillInSearchResults)
          skill = existingSkillInSearchResults;
        else if (!isPending && text.trim())
          skill = { name: text };
      }
    }

    if (skill && !skills.some(s => s.name.toLowerCase() === skill.name.toLowerCase())) {
      onAdd(skill);
      setText("");
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter") {
			if (e.target === inputRef.current) {
				e.preventDefault();
        addSkill();
			}
    } else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && listRef.current) {
      const itemButtons = listRef.current.getElementsByTagName("button");
      
      if (e.target === inputRef.current) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          itemButtons[0].focus();
        }
      } else {
        for (let i = 0; i < itemButtons.length; i++) {
          if (e.target === itemButtons[i]) {
            switch (e.key) {
              case "ArrowUp":
                e.preventDefault();
  
                if (i > 0)
                  itemButtons[i - 1].focus();
                else
                  inputRef.current?.focus();
  
                break;
              case "ArrowDown":
                if (i < itemButtons.length - 1) {
                  e.preventDefault();
                  itemButtons[i + 1].focus();
                }

                break;
            }
            
            break;
          }
        }
      }
    }
  }

  const showNewSkillListItem = !dropdown && !isPending && !existingSkill && !existingSkillInSearchResults;
  
  return (
    <div className="flex shrink-0">
      <div className="grow dropdown dropdown-start" onKeyDown={handleKeyDown}>
        <label className={`input w-full ${size === "sm" ? "input-sm" : ""}`}>
          <input 
            className={`grow text-base ${size === "sm" ? "text-sm" : ""}`} 
            maxLength={100}
            onChange={e => setText(e.target.value)} 
            placeholder="Enter a skill"
            ref={inputRef}
            type="text" 
            value={text} 
          />
          <span className={`${isPending ? "visible" : "invisible"} loading loading-ring loading-md`} />
        </label>
        {text.trim() && (searchResults.length > 0 || showNewSkillListItem) && (
          <ul 
            className="dropdown-content menu bg-base-100 rounded-box z-1 w-full p-2 shadow-sm border border-base-content/10"
            ref={listRef}
          >
            {showNewSkillListItem && (
              <li>
                <button 
                  className="w-full flex justify-between p-1 px-2 overflow-hidden" 
                  onClick={() => { if (!isPending && text.trim()) addSkill({ name: text }); }}
                  type="button"
                >
                  <span className="grow overflow-hidden">{text}</span>
                  <span className="text-xs text-gray-500">NEW</span>
                </button>
              </li>
            )}
            {searchResults.map((skill, idx) => (
              <li key={idx}>
                <button className="p-1 px-2" onClick={() => addSkill(skill)} type="button">{skill.name}</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {!dropdown && (
        <button className="btn btn-primary ml-4" onClick={() => addSkill()} type="button">
          <FaPlus />Add
        </button>
      )}
    </div>
  )
}