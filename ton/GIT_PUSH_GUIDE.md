# Git Push 문제 해결 가이드

## 문제: "push declined due to repository rule violations"

### 해결 완료 ✅
1. `.gitignore` 파일 추가 완료
2. `__pycache__` 파일 제거 완료
3. **`.env` 파일 제거 완료** (민감한 정보 포함)

### 다음 단계

#### 1. 다시 푸시 시도
```bash
cd C:\Users\user\Desktop\ton1\ton
git push origin main
```

#### 2. 여전히 오류가 발생한다면

**가능한 원인들:**

##### A. 브랜치 보호 규칙 (Branch Protection Rules)
- GitHub 리포지토리 → Settings → Branches
- "main" 브랜치에 보호 규칙이 설정되어 있을 수 있습니다
- 해결: Pull Request를 통해 푸시하거나, 보호 규칙을 일시적으로 해제

##### B. 큰 파일 (100MB 이상)
- `venv/` 또는 `node_modules/` 폴더가 포함되어 있을 수 있습니다
- 확인:
  ```bash
  git ls-files | ForEach-Object { Get-Item $_ -ErrorAction SilentlyContinue | Where-Object { $_.Length -gt 100MB } }
  ```
- 해결: `.gitignore`에 이미 추가되어 있으므로, 이미 커밋된 파일이 있다면:
  ```bash
  git rm -r --cached backend/venv frontend/node_modules
  git commit -m "Remove large folders"
  git push
  ```

##### C. 필수 파일 누락
- 일부 리포지토리는 특정 파일(예: README.md, LICENSE)을 요구할 수 있습니다
- 확인: GitHub 리포지토리 Settings → Rules → Required files

##### D. 커밋 메시지 규칙
- 커밋 메시지 형식이 요구사항과 맞지 않을 수 있습니다
- 해결: 의미 있는 커밋 메시지 사용

### 대안: Pull Request 사용

브랜치 보호 규칙 때문에 직접 푸시가 막혀있다면:

```bash
# 새 브랜치 생성
git checkout -b update/add-gitignore

# 변경사항 커밋 (이미 완료됨)
# git commit -m "Add .gitignore and remove cache files"

# 브랜치 푸시
git push origin update/add-gitignore

# GitHub에서 Pull Request 생성
```

### 추가 확인사항

1. **GitHub 리포지토리 설정 확인**
   - Settings → Rules → Rulesets
   - 어떤 규칙이 설정되어 있는지 확인

2. **파일 크기 확인**
   ```bash
   git ls-files -z | xargs -0 du -h | sort -rh | head -20
   ```

3. **인증 확인**
   - Personal Access Token이 올바른 권한을 가지고 있는지 확인
   - Settings → Developer settings → Personal access tokens
