const concepts = [
  ["레포트", "리포트", "보고서", "과제 글"],
  ["발표", "프레젠테이션", "슬라이드", "파워포인트", "ppt", "pptx"],
  ["예상문제", "연습문제", "시험 문제", "퀴즈", "시험 대비", "시험 준비"],
  ["강의 노트", "강의 필기", "수업 필기"],
  ["조별과제", "팀플", "팀 프로젝트", "그룹 과제"],
  ["자기소개서", "자소서", "지원서"],
  ["엑셀", "스프레드시트", "excel", "xlsx"],
  ["워드", "word", "docx"],
  ["웹 디자인", "프론트엔드", "frontend", "웹 UI"],
  ["공지", "안내문", "공지문"],
];

function normalize(text: string) {
  return text.normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

const aliases = concepts.map((group) => group.map(normalize));
const filler = /^(좀|제발|어떻게|하는|할|하고|싶어|싶어요|싶은데|법|방법|찾아줘|알려줘|만들어줘|추천해줘|짜줘)$/;
const particle = /(?<=^[가-힣]{2,})(에서|으로|에게|부터|까지|처럼|은|는|이|가|을|를|에|도|로|와|과)$/;

function contains(words: string[], phrase: string[]) {
  const compact = phrase.join("");
  return words.some((word, index) =>
    word === compact || words.slice(index, index + phrase.length).join("") === compact
  );
}

function oneEdit(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let index = 0;
  while (index < a.length && a[index] === b[index]) index++;
  if (a.length === b.length) {
    return a.slice(index + 1) === b.slice(index + 1) ||
      (a[index] === b[index + 1] && a[index + 1] === b[index] &&
        a.slice(index + 2) === b.slice(index + 2));
  }
  const [longer, shorter] = a.length > b.length ? [a, b] : [b, a];
  return longer.slice(index + 1) === shorter.slice(index);
}

export function searchLibrary<T extends { title: string }>(
  items: T[],
  query: string,
  details: (item: T) => string,
  rank = true,
): T[] {
  const words = normalize(query);
  if (!words.length) return items;

  const compactQuery = words.join("");
  const terms = words.filter((word) => !filler.test(word));
  const queryWords = terms.length ? terms : words;
  const queryRoots = queryWords.map((word) => word.replace(particle, ""));
  const related = aliases.filter((group) =>
    group.some((phrase) => contains(queryWords, phrase) || contains(queryRoots, phrase))
  );

  const scored = items.flatMap((item) => {
    const title = normalize(item.title);
    const compactTitle = title.join("");
    if (compactTitle === compactQuery) return [{ item, score: 100 }];
    if (compactTitle.includes(compactQuery)) return [{ item, score: 90 }];

    const extra = normalize(details(item));
    if (extra.join("").includes(compactQuery)) return [{ item, score: 80 }];

    const fields = [...title, ...extra];
    const roots = fields.map((word) => word.replace(particle, ""));
    const matched = queryWords.filter((word, index) =>
      fields.some((field, fieldIndex) =>
        field.includes(word) || (queryRoots[index].length >= 2 && roots[fieldIndex] === queryRoots[index])
      )
    ).length;
    if (matched === queryWords.length) return [{ item, score: 70 }];

    const conceptMatches = related.filter((group) =>
      group.some((phrase) => contains(fields, phrase) || contains(roots, phrase))
    ).length;
    if (conceptMatches) return [{ item, score: 45 + 15 * (matched / queryWords.length) }];

    if (matched >= 2 && matched / queryWords.length >= 0.5) {
      return [{ item, score: 40 + 10 * (matched / queryWords.length) }];
    }

    if (queryWords.length === 1 && compactQuery.length >= 3 &&
      title.some((word) => oneEdit(word, compactQuery))) {
      return [{ item, score: 30 }];
    }
    return [];
  });

  if (rank) scored.sort((a, b) => b.score - a.score);
  return scored.map(({ item }) => item);
}
