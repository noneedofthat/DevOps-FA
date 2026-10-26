import os
import re
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

FONT_PRIMARY = 'Google Sans'
FONT_FALLBACK = 'Arial'

COLOR_SLATE_900 = RGBColor(15, 23, 42)    # #0F172A - Main Titles & Bold Labels
COLOR_BLUE_900 = RGBColor(30, 58, 138)     # #1E3A8A - Major Section Headings
COLOR_BLUE_700 = RGBColor(29, 78, 216)     # #1D4ED8 - Subheadings / File Paths
COLOR_BODY = RGBColor(51, 65, 85)          # #334155 - Standard Body Text
COLOR_MUTED = RGBColor(100, 116, 139)      # #64748B - Footers & Secondary Meta
COLOR_ACCENT = RGBColor(37, 99, 235)       # #2563EB - Highlights & Code Runs

def apply_font(run, font_name=FONT_PRIMARY, size_pt=10, bold=False, italic=False, color_rgb=COLOR_BODY):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = color_rgb
    
    rPr = run._r.get_or_add_rPr()
    rFonts = OxmlElement('w:rFonts')
    rFonts.set(qn('w:ascii'), font_name)
    rFonts.set(qn('w:hAnsi'), font_name)
    rFonts.set(qn('w:cs'), font_name)
    rPr.append(rFonts)

def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    apply_font(r, font_name=FONT_PRIMARY, size_pt=14, bold=True, color_rgb=COLOR_BLUE_900)
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(13)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    apply_font(r, font_name=FONT_PRIMARY, size_pt=11.5, bold=True, color_rgb=COLOR_BLUE_700)
    return p

def add_heading_3(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(9)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    apply_font(r, font_name=FONT_PRIMARY, size_pt=10.5, bold=True, color_rgb=COLOR_SLATE_900)
    return p

def add_bullet(doc, bold_label, text, level=0, space_after=3):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.left_indent = Inches(0.25 * (level + 1))
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    
    if bold_label:
        r_pre = p.add_run(bold_label)
        apply_font(r_pre, font_name=FONT_PRIMARY, size_pt=9.5, bold=True, color_rgb=COLOR_SLATE_900)
    
    if text:
        r_txt = p.add_run(text)
        apply_font(r_txt, font_name=FONT_PRIMARY, size_pt=9.5, bold=False, color_rgb=COLOR_BODY)
    return p

def add_code_bullet(doc, bold_label, code_text, explanation_text="", level=1):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.left_indent = Inches(0.25 * (level + 1))
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    
    if bold_label:
        r_pre = p.add_run(bold_label)
        apply_font(r_pre, font_name=FONT_PRIMARY, size_pt=9.5, bold=True, color_rgb=COLOR_SLATE_900)
        
    if code_text:
        r_code = p.add_run(f" {code_text} ")
        apply_font(r_code, font_name=FONT_PRIMARY, size_pt=9.0, bold=True, color_rgb=COLOR_ACCENT)
        
    if explanation_text:
        r_txt = p.add_run(explanation_text)
        apply_font(r_txt, font_name=FONT_PRIMARY, size_pt=9.5, bold=False, color_rgb=COLOR_BODY)
    return p

def add_callout(doc, tag, title, body_text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.25)
    p.paragraph_format.right_indent = Inches(0.25)
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15

    pPr = p._p.get_or_add_pPr()
    pBdr = parse_xml(f'''
        <w:pBdr {nsdecls("w")}>
            <w:left w:val="single" w:sz="24" w:space="8" w:color="2563EB"/>
        </w:pBdr>
    ''')
    pPr.append(pBdr)

    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F1F5F9"/>')
    pPr.append(shd)

    r_tag = p.add_run(f"[{tag}] ")
    apply_font(r_tag, font_name=FONT_PRIMARY, size_pt=9.5, bold=True, color_rgb=COLOR_BLUE_900)

    r_title = p.add_run(f"{title}: ")
    apply_font(r_title, font_name=FONT_PRIMARY, size_pt=9.5, bold=True, color_rgb=COLOR_SLATE_900)

    r_body = p.add_run(body_text)
    apply_font(r_body, font_name=FONT_PRIMARY, size_pt=9.5, bold=False, color_rgb=COLOR_BODY)
    return p

def generate_cheat_sheet():
    doc = docx.Document()

    # Page Margins: Standard 0.75 in
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)

        # Header
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("HackGrid Technical Defense • Senior Architect Comprehensive Cheat Sheet")
        apply_font(hrun, FONT_PRIMARY, 8.5, color_rgb=COLOR_MUTED)

        # Footer
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        frun = fp.add_run("PCCOE Pune • DevOps & Cloud Architecture Technical Defense")
        apply_font(frun, FONT_PRIMARY, 8.5, color_rgb=COLOR_MUTED)

    # Title Block (No tables used)
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(6)
    title_p.paragraph_format.space_after = Pt(2)
    r_title = title_p.add_run("HackGrid Platform - Technical Defense & Architecture Cheat Sheet")
    apply_font(r_title, FONT_PRIMARY, 20, bold=True, color_rgb=COLOR_SLATE_900)

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(8)
    r_sub = sub_p.add_run("Exhaustive Field-by-Field Code Search Map, Complete Validation Catalog (Participant & Admin), DevOps Toolchain Justifications, and Live Prometheus/Grafana Observability Runbook")
    apply_font(r_sub, FONT_PRIMARY, 10.5, italic=True, color_rgb=COLOR_BLUE_700)

    # Document Metadata in Bullet Format
    meta_p = doc.add_paragraph()
    meta_p.paragraph_format.space_before = Pt(0)
    meta_p.paragraph_format.space_after = Pt(8)
    r_m1 = meta_p.add_run("Target Project: ")
    apply_font(r_m1, FONT_PRIMARY, 9, bold=True, color_rgb=COLOR_SLATE_900)
    r_m2 = meta_p.add_run("HackGrid Event Management Portal  |  ")
    apply_font(r_m2, FONT_PRIMARY, 9, bold=False, color_rgb=COLOR_BODY)
    r_m3 = meta_p.add_run("Architecture Tier: ")
    apply_font(r_m3, FONT_PRIMARY, 9, bold=True, color_rgb=COLOR_SLATE_900)
    r_m4 = meta_p.add_run("Next.js 16 Edge + Java Spring Boot / Express + Kubernetes  |  ")
    apply_font(r_m4, FONT_PRIMARY, 9, bold=False, color_rgb=COLOR_BODY)
    r_m5 = meta_p.add_run("Evaluation Format: ")
    apply_font(r_m5, FONT_PRIMARY, 9, bold=True, color_rgb=COLOR_SLATE_900)
    r_m6 = meta_p.add_run("Oral Defense & Live Code Inspection")
    apply_font(r_m6, FONT_PRIMARY, 9, bold=False, color_rgb=COLOR_BODY)

    add_callout(doc, "DEFENSE STRATEGY", "Architectural Posture & Code Inspection Strategy", 
        "During the university examination, present this architecture through the lens of zero-trust defense-in-depth: "
        "1) Client-side pre-flight regex to minimize network overhead and save compute cycles; "
        "2) Next.js Edge Middleware for role authorization before React hydration; "
        "3) Strict backend DTO payload sanitization before persistence; "
        "4) Explicit field-level constraints on every input across both Participant and Administrator portals; and "
        "5) Continuous observability with Prometheus time-series scraping and Grafana executive dashboards.")

    # =========================================================================
    # SECTION 1: COMPLETE PROJECT FIELD & VALIDATION CATALOG
    # =========================================================================
    add_heading_1(doc, "Section 1: Complete Project Field & Validation Catalog")

    p_s1_intro = doc.add_paragraph()
    p_s1_intro.paragraph_format.space_after = Pt(6)
    r_s1_intro = p_s1_intro.add_run(
        "Use this exhaustive field catalog to instantly navigate the codebase via Ctrl+F during the presentation. "
        "Every single user and administrator input is mapped to its exact source file, UI element, state variable, validation logic, "
        "character limits, regex constraints, and error messages."
    )
    apply_font(r_s1_intro, FONT_PRIMARY, 9.5, bold=False, color_rgb=COLOR_BODY)

    # -------------------------------------------------------------------------
    # PART 1: PARTICIPANT INPUT FIELDS (THE HACKER)
    # -------------------------------------------------------------------------
    add_heading_2(doc, "Part 1: Participant Input Fields (The Hacker)")

    # 1. Participant Authentication Fields
    add_heading_3(doc, "1. Participant Authentication Fields")
    add_bullet(doc, "Source File: ", "src/app/login/page.tsx", level=0)
    
    add_bullet(doc, "Field: Magic Link Email (email): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Text input labeled \"Enter your email address\" under \"Sign in with email (magic link)\".", level=2)
    add_code_bullet(doc, "State Hook:", "const [email, setEmail] = useState('');", "", level=2)
    add_code_bullet(doc, "Validation Logic:", "if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) { setMessage(\"Please enter a valid email address.\"); return; }", "", level=2)
    add_bullet(doc, "Constraint: ", "RFC-compliant email, no leading/trailing whitespace, valid top-level domain.", level=2)
    add_bullet(doc, "Error Feedback: ", "Inline alert \"Please enter a valid email address.\" halts execution before calling signIn(\"email\", ...).", level=2)

    add_bullet(doc, "Field: GitHub OAuth Button (githubOAuth): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Dark button labeled \"Continue with GitHub\".", level=2)
    add_bullet(doc, "Action: ", "Triggers signIn(\"github\") initiating NextAuth OAuth exchange.", level=2)

    # 2. Team Creation & Workspace Formation Fields
    add_heading_3(doc, "2. Team Creation & Workspace Formation Fields")
    add_bullet(doc, "Source Files: ", "src/components/TeamCreationModal.tsx and src/app/team/page.tsx", level=0)

    add_bullet(doc, "Field: Team Name (teamName): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Input labeled \"Team name *\" (placeholder: \"e.g. CyberKnights or Quantum Forge\").", level=2)
    add_code_bullet(doc, "State Hook:", "const [teamName, setTeamName] = useState('');", "", level=2)
    add_bullet(doc, "Length Constraint: ", "Enforced at val.length <= 50 directly in handleNameChange.", level=2)
    add_code_bullet(doc, "ASCII & No-Emoji Validation:", r'const asciiRegex = /^[\x00-\x7F]*$/; if (!asciiRegex.test(trimmedName)) { setValidationError("Special symbols and emojis are prohibited. Use standard alphanumeric text."); return; }', "", level=2)
    add_code_bullet(doc, "Presence Check:", 'if (!trimmedName) { setValidationError("Team name is required."); return; }', "", level=2)

    add_bullet(doc, "Field: Target Event Selection (selectedEvent / eventId): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Dropdown select labeled \"Select event *\".", level=2)
    add_bullet(doc, "Allowed Values: ", "\"Campus Innovation Sprint 2026\", \"AI for Good Hackathon\", \"Design the Future\", \"GreenTech Buildathon\".", level=2)
    add_code_bullet(doc, "State Hook:", "const [selectedEvent, setSelectedEvent] = useState(DEFAULT_EVENTS[0].title);", "", level=2)
    add_bullet(doc, "Constraint: ", "Must bind to an active event record in the database.", level=2)

    add_bullet(doc, "Field: Team Description / Project Pitch (description): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Textarea labeled \"Team description / Project pitch *\".", level=2)
    add_code_bullet(doc, "State Hook:", "const [description, setDescription] = useState('');", "", level=2)
    add_bullet(doc, "Length Constraint: ", "Enforced at val.length <= 200 in modal (up to 500 characters in schema).", level=2)
    add_bullet(doc, "ASCII Check: ", "!asciiRegex.test(description) rejects non-standard unicode characters.", level=2)

    add_bullet(doc, "Field: Team Join Code (joinCode): ", "", level=1)
    add_code_bullet(doc, "Generation Logic:", "Math.random().toString(36).substring(2, 8).toUpperCase()", "", level=2)
    add_bullet(doc, "Format: ", "6-character uppercase alphanumeric string (e.g., FUYCHN).", level=2)
    add_bullet(doc, "UI Interaction: ", "Dashed button labeled \"Invite member (Code: FUYCHN)\". Clicking copies the code to the clipboard, temporarily changing button text to \"Code Copied to Clipboard!\" for 2000ms.", level=2)

    add_bullet(doc, "Field: Team Roles (members, memberDetails): ", "", level=1)
    add_bullet(doc, "State: ", "Array of member objects { uid, name, role, initials, colorBg }.", level=2)
    add_bullet(doc, "Captain Role: ", "Defaults to current user UID (role: \"Team Lead\").", level=2)

    # 3. Project Deliverable Submission Fields
    add_heading_3(doc, "3. Project Deliverable Submission Fields")
    add_bullet(doc, "Source File: ", "src/app/submit/page.tsx", level=0)
    add_bullet(doc, "Form Controller: ", "React Hook Form with Zod schema resolver (zodResolver(submissionSchema)).", level=0)

    add_bullet(doc, "Field: Project Title (title): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Input labeled \"Project title *\" (placeholder: \"Enter your project title\").", level=2)
    add_code_bullet(doc, "Zod Schema:", r'z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters").regex(/^[\x00-\x7F]*$/, "Emojis and special symbols are strictly prohibited")', "", level=2)
    add_bullet(doc, "Checklist Tracker: ", "Real-time checklist item 1 tracks minimum 3-character threshold.", level=2)

    add_bullet(doc, "Field: Project Description (description): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Textarea labeled \"Project description *\".", level=2)
    add_code_bullet(doc, "Zod Schema:", r'z.string().min(10, "Description must be at least 10 characters").max(1000, "Description cannot exceed 1000 characters").regex(/^[\x00-\x7F]*$/)', "", level=2)

    add_bullet(doc, "Field: GitHub Repository URL (githubUrl / repoUrl): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Input labeled \"GitHub repository URL *\" with link icon.", level=2)
    add_code_bullet(doc, "Zod Schema:", 'z.string().url("Must be a valid URL").regex(/github\\.com/, "Must be a valid GitHub repository link")', "", level=2)
    add_bullet(doc, "Checklist Tracker: ", "Checklist item 2 transitions to \"Completed\" upon domain verification.", level=2)

    add_bullet(doc, "Field: Live Demo URL (liveDemoUrl / liveAppUrl): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Input labeled \"Live demo URL (optional)\" with globe icon.", level=2)
    add_code_bullet(doc, "Zod Schema:", "z.string().url(\"Must be a valid URL\").optional().or(z.literal(''))", "", level=2)

    add_bullet(doc, "Field: Presentation Deck Asset (file / fileName / assetUrl): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Drag-and-drop zone labeled \"Choose file or drag and drop (PDF only, max 10 MB)\".", level=2)
    add_code_bullet(doc, "Mandatory Constraint:", 'if (!file) { setFileError("Project presentation (PDF) is required."); return; }', "", level=2)
    add_code_bullet(doc, "Format Validation:", 'if (!selectedFile.name.toLowerCase().endsWith(\'.pdf\')) { setFileError("Invalid format. Please upload a PDF file."); return; }', "", level=2)
    add_code_bullet(doc, "Size Limit Validation:", 'if (selectedFile.size > 10 * 1024 * 1024) { setFileError("File size exceeds the 10 MB limit."); return; }', "", level=2)

    add_bullet(doc, "Field: Cryptographic SHA-256 Seal (sha256Hash & uniqueSubId): ", "", level=1)
    add_code_bullet(doc, "Digest String:", 'const payloadString = `${uniqueSubId}-${data.title}-${data.githubUrl}-${file.name}-${unixTime}`;', "", level=2)
    add_code_bullet(doc, "Execution:", 'const sha256 = await computeSha256(payloadString); via window.crypto.subtle.digest("SHA-256", ...).', "", level=2)
    add_bullet(doc, "Locked State: ", "Replaces editable form with SubmissionLockedReceipt.tsx, rendering a 64-character hexadecimal digest and badge \"SUBMISSION VERIFIED & LOCKED\".", level=2)

    # -------------------------------------------------------------------------
    # PART 2: ADMINISTRATOR & JUDGE INPUT FIELDS
    # -------------------------------------------------------------------------
    add_heading_2(doc, "Part 2: Administrator & Judge Input Fields")

    # 1. Administrator Authentication & MFA Fields
    add_heading_3(doc, "1. Administrator Authentication & MFA Fields")
    add_bullet(doc, "Source Files: ", "src/app/admin/login/page.tsx and src/lib/api.ts", level=0)

    add_bullet(doc, "Field: Admin Email Address (email): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Input labeled \"Email address\" (placeholder: \"admin@example.com\").", level=2)
    add_code_bullet(doc, "Pre-Flight Validation:", 'if (!trimmedEmail) { setErrorMessage("Administrator email address is required."); return; }', "", level=2)

    add_bullet(doc, "Field: Security Key / Password (password): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Input labeled \"Password\" with visibility toggle button.", level=2)
    add_code_bullet(doc, "Pre-Flight Validation:", 'if (!trimmedPassword) { setErrorMessage("Security Key / Password is required."); return; }', "", level=2)

    add_bullet(doc, "Field: 6-Digit TOTP Authenticator Code (totpDigits): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Six individual numeric boxes under \"Authenticator code (TOTP)\".", level=2)
    add_code_bullet(doc, "State Hook:", "const [totpDigits, setTotpDigits] = useState(['', '', '', '', '', '']);", "", level=2)
    add_bullet(doc, "Input Sanitization: ", "const cleaned = value.replace(/\\D/g, ''); (strips non-numeric characters).", level=2)
    add_bullet(doc, "Auto-Focus Progression: ", "Advances to inputRefs.current[index + 1] on keystroke; retreats on Backspace.", level=2)
    add_code_bullet(doc, "Completeness Validation:", 'if (fullTotp.length !== 6 || totpDigits.some((d) => !d.trim())) { setErrorMessage("Please enter the full 6-digit authenticator code."); return; }', "", level=2)

    add_bullet(doc, "Field: Rate Limiting Guard (isRateLimited, retryAfterSeconds): ", "", level=1)
    add_bullet(doc, "Trigger: ", "HTTP 429 Too Many Requests response from /api/admin/verify.", level=2)
    add_code_bullet(doc, "State Hook:", "setRetryAfterSeconds(result.retryAfter || 60); setIsRateLimited(true);", "", level=2)
    add_bullet(doc, "Alert Banner: ", "\"Too many authentication attempts. Rate limit exceeded. Please wait 60 seconds before retrying.\"", level=2)

    # 2. Submissions Management & Context Menu Fields
    add_heading_3(doc, "2. Submissions Management & Context Menu Fields")
    add_bullet(doc, "Source File: ", "src/app/admin/submissions/page.tsx", level=0)

    add_bullet(doc, "Field: Search Query (searchQuery): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Input labeled \"Search by team name, project title...\".", level=2)
    add_code_bullet(doc, "State Hook:", "const [searchQuery, setSearchQuery] = useState('');", "", level=2)
    add_bullet(doc, "Filtering Logic: ", "Substring match against item.teamName.toLowerCase() or item.projectTitle.toLowerCase().", level=2)

    add_bullet(doc, "Field: Status Filter Dropdown (statusFilter): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Dropdown select defaulted to \"All status\".", level=2)
    add_bullet(doc, "Options: ", "\"All status\", \"Valid\", \"Under review\", \"Disqualified\".", level=2)
    add_bullet(doc, "Filtering Logic: ", "statusFilter === 'All status' || item.status === statusFilter.", level=2)

    add_bullet(doc, "Field: Track Filter Dropdown (trackFilter): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Dropdown select defaulted to \"All tracks\".", level=2)
    add_bullet(doc, "Options: ", "\"All tracks\", \"Sustainability\", \"AI for Social Impact\", \"Design & Innovation\".", level=2)

    add_bullet(doc, "Field: Status Mutation Context Action (handleUpdateStatus): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Three vertical dots (\"...\") on each table row.", level=2)
    add_bullet(doc, "Options: ", "\"Mark as valid\", \"Disqualify\", \"Under review\".", level=2)
    add_code_bullet(doc, "State Mutation:", 'await updateDoc(doc(db, "submissions", id), { status: newStatus });', "", level=2)

    add_bullet(doc, "Field: Destructive Deletion Name Match (confirmDeleteInput): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Modal input: \"Type the team name to confirm deletion\".", level=2)
    add_code_bullet(doc, "State Hook:", "const [confirmDeleteInput, setConfirmDeleteInput] = useState('');", "", level=2)
    add_code_bullet(doc, "Safety Validation:", "if (confirmDeleteInput.trim() !== deleteTargetSub.teamName.trim()) return;", "", level=2)
    add_bullet(doc, "Action: ", "Delete button remains disabled until exact team name is matched; triggers deleteDoc(...).", level=2)

    add_bullet(doc, "Field: CSV Export Dataset Fields: ", "", level=1)
    add_bullet(doc, "UI Element: ", "Button labeled \"Export CSV\".", level=2)
    add_bullet(doc, "Export Headers: ", "ID, Team Name, Project Title, Track, Submitted On, Status, Asset URL.", level=2)

    # 3. Judging Rubric Matrix & Quantitative Scoring Fields
    add_heading_3(doc, "3. Judging Rubric Matrix & Quantitative Scoring Fields")
    add_bullet(doc, "Source File: ", "src/app/judge/evaluate/[id]/page.tsx", level=0)

    add_bullet(doc, "Field: Criterion 1 - Innovation & Originality (scores.innovation): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Number input / slider with label \"Innovation & Originality\".", level=2)
    add_bullet(doc, "Range & Clamping: ", "0 to 30 points via Math.max(0, Math.min(parsed, 30)).", level=2)

    add_bullet(doc, "Field: Criterion 2 - Technical Execution (scores.technical): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Number input / slider with label \"Technical Execution\".", level=2)
    add_bullet(doc, "Range & Clamping: ", "0 to 30 points via Math.max(0, Math.min(parsed, 30)).", level=2)

    add_bullet(doc, "Field: Criterion 3 - Impact & Feasibility (scores.impact): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Number input / slider with label \"Impact & Feasibility\".", level=2)
    add_bullet(doc, "Range & Clamping: ", "0 to 25 points via Math.max(0, Math.min(parsed, 25)).", level=2)

    add_bullet(doc, "Field: Criterion 4 - Presentation & Demo (scores.presentation): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Number input / slider with label \"Presentation & Demo\".", level=2)
    add_bullet(doc, "Range & Clamping: ", "0 to 15 points via Math.max(0, Math.min(parsed, 15)).", level=2)

    add_bullet(doc, "Field: Dynamic Aggregate Score (totalScore): ", "", level=1)
    add_code_bullet(doc, "Calculation:", "totalScore = Number(innovation) + Number(technical) + Number(impact) + Number(presentation);", "", level=2)
    add_bullet(doc, "Range: ", "0 to 100 total points; dynamically updates the header badge and progress bar.", level=2)

    add_bullet(doc, "Field: Qualitative Remarks (feedback): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Textarea labeled \"Overall feedback (optional)\".", level=2)
    add_bullet(doc, "Length Constraint: ", "Character counter monitors val.length <= 500 characters.", level=2)

    add_bullet(doc, "Field: Submit Evaluation & Lock Action (handleSubmit): ", "", level=1)
    add_bullet(doc, "Action: ", "Persists scores to Firestore evaluations, recalculates leaderboard standings, updates submission status to 'Approved', and redirects to /admin/submissions.", level=2)

    # 4. Executive Dashboard & Telemetry Fields
    add_heading_3(doc, "4. Executive Dashboard & Telemetry Fields")
    add_bullet(doc, "Source File: ", "src/app/admin/page.tsx", level=0)

    add_bullet(doc, "Field: Event Cohort Selector (selectedEvent): ", "", level=1)
    add_bullet(doc, "UI Element: ", "Dropdown select in dashboard header.", level=2)
    add_bullet(doc, "Default: ", "\"Campus Innovation Sprint 2026\".", level=2)

    add_bullet(doc, "Field: Top KPI Aggregates: ", "", level=1)
    add_bullet(doc, "Registrations Count: ", "248 registered students.", level=2)
    add_bullet(doc, "Teams Count: ", "62 active teams.", level=2)
    add_bullet(doc, "Submissions Count: ", "48 locked submissions.", level=2)

    add_bullet(doc, "Field: Live Telemetry Gauges (/admin/grafana): ", "", level=1)
    add_code_bullet(doc, "Throughput Metric:", "sum(rate(http_requests_total[1m])) (QPS).", "", level=2)
    add_code_bullet(doc, "Liveness Heartbeat:", 'up{job="hackathon-backend"} (1 = healthy).', "", level=2)
    add_code_bullet(doc, "Memory Metric:", "process_resident_memory_bytes / 1024 / 1024 (MB).", "", level=2)

    # -------------------------------------------------------------------------
    # PART 3: BACKEND (JAVA SPRING BOOT) DTO SANITIZATION ANNOTATIONS
    # -------------------------------------------------------------------------
    add_heading_2(doc, "Part 3: Backend (Java Spring Boot) DTO Sanitization Annotations")
    add_bullet(doc, "Source Package: ", "com.hackgrid.hackathon.dto (configured in pom.xml)", level=0)

    add_bullet(doc, "UserRegistrationDTO.java: ", "", level=0)
    add_code_bullet(doc, "Email Validation:", '@NotNull(message = "Email cannot be null") @Email(regexp = "^[A-Za-z0-9+_.-]+@(.+)$") private String email;', "", level=1)
    add_code_bullet(doc, "Full Name Validation:", '@NotBlank(message = "Name is required") @Size(min = 2, max = 80) private String fullName;', "", level=1)
    add_code_bullet(doc, "Password Complexity:", '@NotNull @Size(min = 8, max = 64) @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}$") private String password;', "", level=1)

    add_bullet(doc, "TeamCreationRequestDTO.java: ", "", level=0)
    add_code_bullet(doc, "Team Name Validation:", '@NotBlank(message = "Team name is required") @Size(min = 3, max = 50) private String teamName;', "", level=1)
    add_code_bullet(doc, "Event Binding Validation:", '@NotNull(message = "Target event ID must be provided") private String eventId;', "", level=1)
    add_code_bullet(doc, "Project Pitch Validation:", '@NotBlank @Size(min = 10, max = 500) private String projectPitch;', "", level=1)

    add_bullet(doc, "ProjectSubmissionDTO.java: ", "", level=0)
    add_code_bullet(doc, "Repository URL Validation:", '@NotNull @Pattern(regexp = "^https://github\\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$") private String githubUrl;', "", level=1)
    add_code_bullet(doc, "Presentation Asset Validation:", '@NotNull(message = "Presentation file asset key is required") private String assetKey;', "", level=1)

    add_bullet(doc, "AdminLoginRequestDTO.java: ", "", level=0)
    add_code_bullet(doc, "TOTP Code Validation:", '@NotNull @Pattern(regexp = "^[0-9]{6}$", message = "TOTP must be exactly 6 numeric digits") private String totpCode;', "", level=1)

    # =========================================================================
    # SECTION 2: DEVOPS TOOLCHAIN JUSTIFICATION & SETUP
    # =========================================================================
    add_heading_1(doc, "Section 2: DevOps Toolchain Justification & Setup")

    p_s2_intro = doc.add_paragraph()
    p_s2_intro.paragraph_format.space_after = Pt(6)
    r_s2_intro = p_s2_intro.add_run(
        "This section details the 10 core DevOps technologies underpinning HackGrid. For each tool, explain: "
        "1) The setup process followed, and 2) Its specific architectural use case in ensuring high availability and scalability for a nationwide hackathon portal."
    )
    apply_font(r_s2_intro, FONT_PRIMARY, 9.5, bold=False, color_rgb=COLOR_BODY)

    # 1. Terraform
    add_heading_2(doc, "1. Terraform (Infrastructure as Code - IaC)")
    add_bullet(doc, "Directory in Codebase: ", "terraform/ (main.tf, terraform.tfstate)", level=0)
    add_bullet(doc, "Setup Process Followed: ", "", level=0)
    add_bullet(doc, "Provider Configuration: ", "Configured the HashiCorp AWS provider (~> 5.0) targeting the Mumbai region (ap-south-1).", level=1)
    add_bullet(doc, "Security Group Definition: ", "Declared aws_security_group 'hackathon_sg' explicitly whitelisting TCP port 22 (SSH management), port 80 (HTTP traffic), and port 5000 (Backend REST API and Prometheus scrape ingress).", level=1)
    add_bullet(doc, "EC2 Provisioning: ", "Declared aws_instance 'hackathon_server' provisioning an Ubuntu 24.04 LTS AMI on t3.micro with a 20GB root EBS block device and SSH key pair 'fal-key'.", level=1)
    add_bullet(doc, "Execution Workflow: ", "Executed terraform init, terraform plan -out=tfplan, and terraform apply tfplan to provision immutable cloud infrastructure deterministically.", level=1)
    add_bullet(doc, "HackGrid Specific Use Case: ", 
        "Provides reproducible, immutable infrastructure. During large-scale hackathons, if the primary server fails or needs replication across availability zones, "
        "Terraform spins up identical, isolated infrastructure in minutes without manual console configuration, eliminating environment drift.", level=0)

    # 2. Ansible
    add_heading_2(doc, "2. Ansible (Configuration Management & Server Hardening)")
    add_bullet(doc, "Directory in Codebase: ", "ansible/ (playbook.yml, inventory.ini, nginx.conf.j2)", level=0)
    add_bullet(doc, "Setup Process Followed: ", "", level=0)
    add_bullet(doc, "Inventory Mapping: ", "Defined inventory.ini with target EC2 public IPs and SSH key paths (ansible_ssh_private_key_file=fal-key.pem).", level=1)
    add_bullet(doc, "Automated Dependency Provisioning: ", "Authored playbook.yml with root privilege escalation (become: yes) to update apt repositories, install ca-certificates, curl, Nginx, and Python.", level=1)
    add_bullet(doc, "Docker Engine Installation: ", "Added the official Docker GPG key to /etc/apt/keyrings/docker.asc, registered the upstream Docker repository, and installed docker-ce and docker-compose-plugin.", level=1)
    add_bullet(doc, "Reverse Proxy Templating: ", "Rendered the Jinja2 template nginx.conf.j2 into /etc/nginx/sites-available/default and registered handlers to automatically restart the Nginx daemon upon configuration changes.", level=1)
    add_bullet(doc, "Execution Command: ", "Executed ansible-playbook -i inventory.ini playbook.yml to configure raw EC2 virtual machines into fully operational application nodes.", level=1)
    add_bullet(doc, "HackGrid Specific Use Case: ", 
        "Ensures consistent node configuration. Instead of manually SSH-ing into servers to install runtimes, Ansible automates node provisioning in under 90 seconds, "
        "guaranteeing every cluster node has matching Docker versions, kernel parameters, and Nginx reverse proxy routing.", level=0)

    # 3. Jenkins
    add_heading_2(doc, "3. Jenkins (Primary CI/CD Orchestration Engine)")
    add_bullet(doc, "Directory in Codebase: ", "Jenkinsfile (Declarative Pipeline)", level=0)
    add_bullet(doc, "Setup Process Followed: ", "", level=0)
    add_bullet(doc, "Pipeline Definition: ", "Authored a declarative Jenkinsfile specifying an automated Build-Test-Security-Deploy lifecycle.", level=1)
    add_bullet(doc, "Parallel Testing Matrix: ", "Configured parallel stages: 1) Test Frontend (Next.js npm ci && npm test), 2) Test Backend (Node.js/Express test suite), and 3) Test Maven Services (mvn clean test for Java Spring Boot modules).", level=1)
    add_bullet(doc, "DevSecOps Integration: ", "Embedded container vulnerability auditing using Trivy filesystem scanning (trivy fs --severity HIGH,CRITICAL .) to block builds containing vulnerabilities.", level=1)
    add_bullet(doc, "Artifact Packaging & Deployment: ", "Configured automated Docker container builds tagged with ${BUILD_NUMBER} and automated rolling deployment to the Kubernetes cluster using kubeconfig credentials.", level=1)
    add_bullet(doc, "HackGrid Specific Use Case: ", 
        "Automates the end-to-end delivery pipeline. Whenever a student or organizer merges code into main, Jenkins validates the build, "
        "executes unit tests across all microservices, scans for security CVEs, and deploys zero-downtime updates to the live event portal.", level=0)

    # 4. Docker
    add_heading_2(doc, "4. Docker (Microservices Containerization)")
    add_bullet(doc, "Directory in Codebase: ", "Dockerfile (Frontend multi-stage) and backend/Dockerfile", level=0)
    add_bullet(doc, "Setup Process Followed: ", "", level=0)
    add_bullet(doc, "Multi-Stage Build Optimization: ", "Designed high-efficiency multi-stage Dockerfiles: Stage 1 (deps) installs node_modules; Stage 2 (builder) compiles the Next.js static and server bundles; Stage 3 (runner) copies only standalone output on a lean alpine base.", level=1)
    add_bullet(doc, "Non-Root Security Hardening: ", "Enforced user privilege separation by creating and executing under a non-root 'nextjs' system user (UID 1001), preventing container breakout attacks.", level=1)
    add_bullet(doc, "Image Build Commands: ", "Executed docker build -t hackathon-frontend . and docker build -t hackathon-backend ./backend.", level=1)
    add_bullet(doc, "HackGrid Specific Use Case: ", 
        "Completely eliminates 'it works on my machine' defects. Packages the Node.js runtime, system libraries, and compiled frontend assets into an immutable, portable artifact "
        "that runs identically on local developer machines, Jenkins CI runners, and production AWS EC2 nodes.", level=0)

    # 5. Docker-Compose
    add_heading_2(doc, "5. Docker-Compose (Multi-Container Local Topology)")
    add_bullet(doc, "Directory in Codebase: ", "docker-compose.yml", level=0)
    add_bullet(doc, "Setup Process Followed: ", "", level=0)
    add_bullet(doc, "Service Topology Mapping: ", "Defined a complete 4-tier microservice architecture: 'frontend' (port 3000), 'backend' (port 5000), 'prometheus' (port 9090), and 'grafana' (port 3001:3000).", level=1)
    add_bullet(doc, "Bridge Networking: ", "Created an isolated bridge network 'hackathon-network' enabling DNS-based service discovery (e.g., Prometheus scraping backend:5000 directly).", level=1)
    add_bullet(doc, "Persistent Volumes: ", "Declared persistent volumes 'backend-uploads', 'prometheus-data', and 'grafana-data' so metric history and file submissions survive container restarts.", level=1)
    add_bullet(doc, "Execution Command: ", "Executed docker-compose up --build -d to launch the entire multi-service stack with a single command.", level=1)
    add_bullet(doc, "HackGrid Specific Use Case: ", 
        "Allows developers and evaluators to boot the entire platform—frontend, backend API, Prometheus time-series scraper, and Grafana dashboards—in 30 seconds "
        "without needing to install and configure separate databases or monitoring agents locally.", level=0)

    # 6. Kubernetes (K8s)
    add_heading_2(doc, "6. Kubernetes (Container Orchestration & Auto-Scaling)")
    add_bullet(doc, "Directory in Codebase: ", "k8s/ (deployment-frontend.yaml, deployment-backend.yaml, hpa.yaml, canary-strategy.yaml, ingress.yaml)", level=0)
    add_bullet(doc, "Setup Process Followed: ", "", level=0)
    add_bullet(doc, "Declarative Deployments: ", "Authored Kubernetes deployment manifests specifying replica counts, resource requests/limits (CPU: 250m-500m, Memory: 256Mi-512Mi), and liveness/readiness HTTP probes.", level=1)
    add_bullet(doc, "Horizontal Pod Autoscaler (HPA): ", "Configured hpa.yaml with target CPU utilization of 70% and memory utilization of 80%, scaling frontend and backend pods dynamically from 2 to 10 replicas.", level=1)
    add_bullet(doc, "Canary Deployment Strategy: ", "Implemented canary-strategy.yaml to route 10% of live participant traffic to newly deployed releases while monitoring error rates before rolling out to 100%.", level=1)
    add_bullet(doc, "Cluster Application: ", "Deployed using kubectl apply -f k8s/namespace.yaml and kubectl apply -f k8s/.", level=1)
    add_bullet(doc, "HackGrid Specific Use Case: ", 
        "Provides dynamic auto-scaling and self-healing. When 5,000 students submit projects simultaneously 5 minutes before the hackathon deadline, "
        "the HPA automatically spins up additional backend pods to handle traffic spikes, preventing downtime and submission timeouts.", level=0)

    # 7. AWS Services (EC2 & Cloud Compute)
    add_heading_2(doc, "7. AWS Services (Elastic Cloud Compute - EC2)")
    add_bullet(doc, "Directory in Codebase: ", "terraform/main.tf, fal-key.pem", level=0)
    add_bullet(doc, "Setup Process Followed: ", "", level=0)
    add_bullet(doc, "Virtual Private Cloud (VPC): ", "Configured public subnets in ap-south-1 with internet gateways and route table mappings.", level=1)
    add_bullet(doc, "Compute Provisioning: ", "Provisioned EC2 t3.micro instance running Ubuntu Server 24.04 LTS with SSD Elastic Block Storage.", level=1)
    add_bullet(doc, "Security Firewalls: ", "Configured AWS Security Groups with least-privilege ingress rules, restricting management ports while permitting public web traffic.", level=1)
    add_bullet(doc, "Key Management: ", "Generated RSA 2048-bit key pair 'fal-key.pem' with chmod 400 permissions for secure cryptographic SSH access.", level=1)
    add_bullet(doc, "HackGrid Specific Use Case: ", 
        "Provides 99.9% uptime enterprise cloud infrastructure. Ensures that the hackathon portal remains accessible 24/7 across the globe "
        "without relying on local campus hardware that is vulnerable to power outages or network interruptions.", level=0)

    # 8. GitHub Actions
    add_heading_2(doc, "8. GitHub Actions (Edge Pre-Commit CI & Verification)")
    add_bullet(doc, "Directory in Codebase: ", ".github/workflows/ci.yml", level=0)
    add_bullet(doc, "Setup Process Followed: ", "", level=0)
    add_bullet(doc, "Workflow Triggers: ", "Configured to trigger automatically on push and pull_request events targeting the main branch.", level=1)
    add_bullet(doc, "Runtime Setup: ", "Installs Node.js 20 on an ubuntu-latest runner with automatic npm dependency caching.", level=1)
    add_bullet(doc, "Automated Constraint Audits: ", "Executes a custom regex script checking for prohibited emojis across all src/ files to enforce strict institutional design guidelines.", level=1)
    add_bullet(doc, "Static Analysis & Build: ", "Executes npm run lint (ESLint) and npm run build (TypeScript compiler) to catch syntax errors, broken imports, or typing bugs prior to Jenkins handoff.", level=1)
    add_bullet(doc, "HackGrid Specific Use Case: ", 
        "Provides rapid developer feedback on GitHub pull requests. Prevents flawed code, unlinted commits, or breaking schema changes from ever reaching main "
        "or triggering expensive cloud deployment pipelines in Jenkins.", level=0)

    # 9. Prometheus
    add_heading_2(doc, "9. Prometheus (Time-Series Metric Scraping Engine)")
    add_bullet(doc, "Directory in Codebase: ", "monitoring/prometheus.yml and backend/src/metrics.ts", level=0)
    add_bullet(doc, "Setup Process Followed: ", "", level=0)
    add_bullet(doc, "Configuration Specification: ", "Defined global scrape_interval: 15s and an aggressive 5-second scrape interval for the 'hackathon-backend' job.", level=1)
    add_bullet(doc, "Microservice Instrumentation: ", "Instrumented the backend with prom-client in backend/src/metrics.ts, exposing standard /metrics endpoints.", level=1)
    add_bullet(doc, "Scrape Targets: ", "Configured static targets for backend:5000, localhost:9090 (self), node-exporter:9100 (host OS), and kube-state-metrics:8080 (cluster pods).", level=1)
    add_bullet(doc, "Deployment: ", "Launched via docker-compose on port 9090 with persistent time-series storage.", level=1)
    add_bullet(doc, "HackGrid Specific Use Case: ", 
        "Continuously collects real-time operational telemetry—HTTP request counts, P95/P99 latency histograms, active database connections, and CPU usage. "
        "Provides the raw time-series data needed to detect performance bottlenecks and evaluate SRE Service Level Objectives (SLOs).", level=0)

    # 10. Grafana
    add_heading_2(doc, "10. Grafana (Observability & Operational Visualization)")
    add_bullet(doc, "Directory in Codebase: ", "docker-compose.yml (port 3001) and public/grafana-dashboard.html", level=0)
    add_bullet(doc, "Setup Process Followed: ", "", level=0)
    add_bullet(doc, "Service Setup: ", "Deployed grafana/grafana-oss:latest with pre-configured persistent volume grafana-data and disabled user self-registration.", level=1)
    add_bullet(doc, "Data Source Connection: ", "Added Prometheus (http://prometheus:9090) as the primary time-series data source.", level=1)
    add_bullet(doc, "Dashboard Provisioning: ", "Created custom visualization panels tracking throughput (QPS), latency heatmaps, error budget burn rates, and Kubernetes pod replicas.", level=1)
    add_bullet(doc, "Portal Integration: ", "Embedded a live telemetry dashboard into the HackGrid admin portal (/admin/grafana) for one-click access by organizers.", level=1)
    add_bullet(doc, "HackGrid Specific Use Case: ", 
        "Translates complex time-series data into actionable visual dashboards. Allows hackathon organizers and lead engineers "
        "to monitor submission traffic spikes, API error spikes, and server load in real time from a single screen.", level=0)

    # =========================================================================
    # SECTION 3: LIVE OBSERVABILITY DEMO (PROMETHEUS & GRAFANA)
    # =========================================================================
    add_heading_1(doc, "Section 3: Live Observability Demo (Prometheus & Grafana)")

    p_s3_intro = doc.add_paragraph()
    p_s3_intro.paragraph_format.space_after = Pt(6)
    r_s3_intro = p_s3_intro.add_run(
        "Follow this exact step-by-step workflow during the presentation when the professor asks for a live demonstration "
        "of metric visualization. This runbook details exactly where to click in the Grafana UI and provides three high-impact PromQL queries."
    )
    apply_font(r_s3_intro, FONT_PRIMARY, 9.5, bold=False, color_rgb=COLOR_BODY)

    # Step-by-Step Graph Creation
    add_heading_2(doc, "Step-by-Step Guide: Creating a Grafana Visualization from Scratch")
    add_bullet(doc, "Step 1 - Access Grafana: ", "Open your browser and navigate to http://localhost:3001 (or http://localhost:3000/admin/grafana). Log in with admin / admin if prompted.", level=0)
    add_bullet(doc, "Step 2 - Navigate to Dashboards: ", "In the left navigation sidebar, click on the Dashboards icon (grid of four squares) and select 'Dashboards'.", level=0)
    add_bullet(doc, "Step 3 - Create New Dashboard: ", "Click the blue 'New' button in the upper-right corner and select 'New Dashboard' from the dropdown menu.", level=0)
    add_bullet(doc, "Step 4 - Add Visualization: ", "Click the large dashed card labeled '+ Add visualization' in the center of the screen.", level=0)
    add_bullet(doc, "Step 5 - Select Prometheus Data Source: ", "In the data source selector modal, click on 'Prometheus' (connected to http://prometheus:9090).", level=0)
    add_bullet(doc, "Step 6 - Enter PromQL Query: ", "Locate the Query Editor at the bottom of the screen. In the query box labeled 'Metric' or 'Code', type your PromQL expression (see queries below).", level=0)
    add_bullet(doc, "Step 7 - Configure Panel Properties (Right Sidebar): ", "", level=0)
    add_bullet(doc, "Panel Title: ", "Change 'Panel Title' to an informative title (e.g., 'Backend Microservice Liveness' or 'HTTP Request Throughput').", level=1)
    add_bullet(doc, "Visualization Type: ", "Select 'Time series' for latency/throughput graphs, or 'Stat' / 'Gauge' for single-value health indicators.", level=1)
    add_bullet(doc, "Step 8 - Run Query & Apply: ", "Click the 'Run queries' button (or Shift+Enter) to verify live data rendering. Then click the blue 'Apply' button in the top-right corner to save the panel.", level=0)

    # Sample PromQL Queries
    add_heading_2(doc, "Sample PromQL Queries for the Live Demonstration")

    # Query 1
    add_heading_3(doc, "Query 1: Backend Service Health & Liveness")
    add_code_bullet(doc, "PromQL Query:", 'up{job="hackathon-backend"}', 
        "Alternative for Spring Boot: `up{job=\"spring-backend\"}`", level=0)
    add_bullet(doc, "Panel Type: ", "Stat panel (choose 'Last *' value calculation).", level=1)
    add_bullet(doc, "Expected Live Value: ", "1 (displayed in green). A value of 0 indicates the service is down.", level=1)
    add_bullet(doc, "What It Proves to the Professor: ", 
        "Demonstrates active heartbeat scraping and service availability. It proves that the Prometheus daemon is actively polling "
        "the backend on port 5000 every 5 seconds, confirming network connectivity, TCP reachability, and process health.", level=1)

    # Query 2
    add_heading_3(doc, "Query 2: Total HTTP Request Volume & Throughput")
    add_code_bullet(doc, "PromQL Query:", "sum(rate(http_requests_total[1m]))", 
        "Alternative for Spring Boot: `sum(rate(http_server_requests_seconds_count[1m]))`", level=0)
    add_bullet(doc, "Panel Type: ", "Time series graph with smoothed curve.", level=1)
    add_bullet(doc, "Expected Live Value: ", "Dynamic rate curve showing Queries Per Second (QPS), e.g., 2.5 req/s.", level=1)
    add_bullet(doc, "What It Proves to the Professor: ", 
        "Demonstrates real-time API traffic throughput. By applying the rate() function over a 1-minute window, it shows the rate of incoming requests per second. "
        "Triggering actions in the HackGrid portal (such as refreshing the submissions table or submitting a project) causes immediate visible spikes on this graph, "
        "proving real-time telemetry streaming from application code to Grafana.", level=1)

    # Query 3
    add_heading_3(doc, "Query 3: JVM / System Memory Utilization")
    add_code_bullet(doc, "PromQL Query:", "process_resident_memory_bytes / 1024 / 1024", 
        "Alternative for Spring Boot: `jvm_memory_used_bytes{area=\"heap\"} / 1024 / 1024`", level=0)
    add_bullet(doc, "Panel Type: ", "Gauge or Time series (Unit: Data -> Megabytes).", level=1)
    add_bullet(doc, "Expected Live Value: ", "Numerical memory usage in MB (e.g., 84.5 MB).", level=1)
    add_bullet(doc, "What It Proves to the Professor: ", 
        "Proves proactive resource capacity planning and leak detection. Shows exact resident memory allocated by the application runtime. "
        "During live hackathons, monitoring this metric proves that memory consumption remains stable under load and does not exceed container memory limits (512Mi), "
        "preventing Kubernetes Out-Of-Memory (OOMKilled) pod terminations.", level=1)

    # SRE Summary Callout
    add_callout(doc, "SRE EVALUATION DEFENSE", "Site Reliability Engineering Principles", 
        "When explaining this dashboard to the faculty committee, emphasize Google SRE's Four Golden Signals: "
        "1) Latency (P95/P99 request duration); "
        "2) Traffic (QPS throughput via http_requests_total); "
        "3) Errors (HTTP 5xx rate vs our 99.9% SLO error budget); and "
        "4) Saturation (CPU, JVM heap, and container memory limits). "
        "This proves that HackGrid is engineered not merely as a functional app, but as a production-grade, highly observable cloud service.")

    # Save Document
    output_filename = "HackGrid_Technical_Defense_Cheat_Sheet.docx"
    output_path = os.path.join(os.getcwd(), output_filename)
    doc.save(output_path)
    print(f"Technical defense cheat sheet successfully updated at: {output_path}")

if __name__ == "__main__":
    generate_cheat_sheet()
