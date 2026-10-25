#!/usr/bin/env bash
# 명령을 돌리고, 실패하면 오류 줄을 GitHub 주석(annotation)으로 남긴다 — 로그를 못 여는 곳에서도 보이게.
#   ci/run.sh <제목> <명령…>
set -u
title="$1"; shift
log="$(mktemp)"
"$@" >"$log" 2>&1
code=$?
root="${GITHUB_WORKSPACE:-$PWD}/"
summary="$(grep -E "Executed [0-9]+ tests|BUILD (SUCCEEDED|FAILED)|\*\* (BUILD|TEST) " "$log" | tail -3 | tr '\n' ' ')"
echo "::notice title=${title}::exit ${code} ${summary}"
if [ $code -ne 0 ]; then
  # 컴파일 오류 · 시험 실패 · 링크 오류
  grep -E "error:|: error|failed \(|XCTAssert|Undefined symbol|fatal error" "$log" \
    | sed "s|${root}||g" | awk '!seen[$0]++' | head -60 > "$log.err"
  [ -s "$log.err" ] || tail -40 "$log" | sed "s|${root}||g" > "$log.err"
  # 주석 하나에 몰아 담는다(한 단계 주석 개수 제한 때문에)
  msg="$(sed -e 's/%/%25/g' -e 's/\r//g' "$log.err" | awk '{printf "%s%%0A", $0}')"
  echo "::error title=${title}::${msg}"
fi
tail -60 "$log"
exit $code
