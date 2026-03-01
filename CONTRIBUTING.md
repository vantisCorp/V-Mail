# Wskazówki dla Współpracowników

Dziękujemy za zainteresowanie projektem Vantis Mail! Ten dokument pomoże Ci rozpocząć pracę.

## 📋 Wymagania

### Techniczne
- Znajomość HTML5, CSS3, JavaScript ES6+
- Przeglądarka obsługująca najnowsze standardy webowe
- Podstawowa znajomość kryptografii (dla pracy nad modułami bezpieczeństwa)
- Zrozumienie architektury Zero Trust

### Narzędzia
- Git i GitHub
- Edytor kodu (VS Code, WebStorm, Sublime Text)
- Serwer HTTP do lokalnego testowania

## 🚀 Jak Zacząć

### 1. Fork i Clone

```bash
# Fork repozytorium na GitHub
# Sklonuj swoje repozytorium
git clone https://github.com/TWOJ-USERNAME/V-Mail.git
cd V-Mail
```

### 2. Uruchomienie Lokalne

```bash
# Użyj Python
python -m http.server 8000

# Lub Node.js
npx http-server -p 8000

# Otwórz http://localhost:8000 w przeglądarce
```

### 3. Tworzenie Brancha

```bash
# Utwórz nowy branch dla swojej zmiany
git checkout -b feature/nazwa-funkcji
# lub
git checkout -b fix/nazwa-błędu
# lub
git checkout -b docs/aktualizacja-dokumentacji
```

## 📝 Konwencje Commitów

Format commitów:

```
type: krótki opis

Dłuższy opis zmian (opcjonalnie)

Closes #issue_number
```

### Typy commitów:
- `feat`: Nowa funkcjonalność
- `fix`: Naprawa błędu
- `docs`: Zmiany w dokumentacji
- `style`: Zmiany w formacie kodu (nie logice)
- `refactor`: Refaktoryzacja kodu
- `test`: Dodanie testów
- `chore`: Inne zmiany (konfiguracja, narzędzia)

### Przykłady:

```bash
git commit -m "feat: Add steganography support for image attachments"
git commit -m "fix: Resolve panic button not clearing local storage"
git commit -m "docs: Update README with new security features"
```

## 🎯 Obszary Pracy

### 1. UI/UX
- Responsywność dla nowych urządzeń
- Animacje i przejścia
- Accessibility (WCAG 2.1)
- Internationalization (i18n)

### 2. Bezpieczeństwo
- Implementacja szyfrowania po stronie klienta
- Sanityzacja input/output
- Testy penetracyjne
- Audyt kodu pod kątem luk

### 3. Funkcjonalność
- Dodawanie nowych funkcji zgodnych z specyfikacją
- Optymalizacja wydajności
- Obsługa załączników
- Integracja z zewnętrznymi API

### 4. Dokumentacja
- Aktualizacja README
- Dodawanie komentarzy w kodzie
- Tworzenie tutoriali
- Pisanie artykułów

## 🧪 Testowanie

### Testowanie Manualne

Przed提交:
1. Uruchom aplikację lokalnie
2. Przetestuj zmienione funkcje
3. Sprawdź responsywność na różnych ekranach
4. Przetestuj w różnych przeglądarkach (Chrome, Firefox, Safari, Edge)

### Lista Kontrolna

- [ ] Kod działa zgodnie z oczekiwaniami
- [ ] Responsywność jest zachowana
- [ ] Bez brakujących plików lub zasobów
- [ ] Konsola jest wolna od błędów
- [ ] Dokumentacja została zaktualizowana
- [ ] Zmiany są zgodne z architekturą Zero Trust

## 📤 Proces Pull Request

### 1. Push Zmian

```bash
git add .
git commit -m "feat: opis zmiany"
git push origin feature/nazwa-funkcji
```

### 2. Utwórz Pull Request

1. Przejdź do repozytorium na GitHub
2. Kliknij "New Pull Request"
3. Wybierz swój branch
4. Wypełnij template PR
5. Prześlij do recenzji

### 3. Szablon PR

```markdown
## Opis
Krótki opis tego, co zostało zrobione.

## Typ Zmiany
- [ ] Nowa funkcjonalność
- [ ] Naprawa błędu
- [ ] Refaktoryzacja
- [ ] Dokumentacja
- [ ] Inne

## Testowanie
Jak przetestować zmiany:
1. ...
2. ...

## Zdjęcia
Załącz zrzuty ekranu (jeśli dotyczy UI).

## Dodatkowe Informacje
Każde dodatkowe kontekst lub uwagi.
```

## 🤞 Kodeks Postępowania

### Zasady
- Bądź uprzejmy i szanuj innych współpracowników
- Koncentruj się na konstruktywnej krytyce
- Słuchaj opinii innych
- Pracuj transparentnie

### Prohibicje
- Nie tolerujemy dyskryminacji
- Nie akceptujemy obraźliwego języka
- Nie zgadzamy się na nękanie

## 📞 Kontakt

### Pytania?
- Otwórz issue na GitHub
- Skontaktuj się z zespołem: contact@vantis.io
- Dołącz do dyskusji w Pull Requests

### Raportowanie Błędów Bezpieczeństwa
Nie otwórz publicznego issue! Zgłoś bezpieczne:
- Email: security@vantis.io
- PGP Key: [dodaj klucz PGP]

## 🎓 Zasoby

- [Dokumentacja GitHub](https://docs.github.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Web Security](https://owasp.org/www-project-web-security-testing-guide/)
- [Zero Trust Architecture](https://www.cisa.gov/zero-trust-architecture)

Dziękujemy za Twój wkład w rozwój Vantis Mail! 🔐