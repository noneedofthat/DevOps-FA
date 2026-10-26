import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

FONT_PRIMARY = 'Google Sans'
FONT_FALLBACK = 'Arial'

COLOR_SLATE_900 = RGBColor(15, 23, 42)    # #0F172A - Main Titles
COLOR_BLUE_900 = RGBColor(30, 58, 138)     # #1E3A8A - Phase Headers
COLOR_BLUE_600 = RGBColor(37, 99, 235)     # #2563EB - Subsections / Links
COLOR_BODY = RGBColor(51, 65, 85)          # #334155 - Body Text
COLOR_MUTED = RGBColor(100, 116, 139)      # #64748B - Metadata / Footers

HEX_HEADER_BG = "0F172A"
HEX_ROW_EVEN = "F8FAFC"
HEX_ROW_ODD = "FFFFFF"
HEX_CALLOUT_BG = "F1F5F9"
HEX_CALLOUT_BORDER = "2563EB"
HEX_NOTE_BG = "EFF6FF"
HEX_NOTE_BORDER = "1D4ED8"
HEX_WARN_BG = "FEF2F2"
HEX_WARN_BORDER = "DC2626"

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def apply_font(run, font_name=FONT_PRIMARY, size_pt=10, bold=False, italic=False, color_rgb=COLOR_BODY):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = color_rgb
    # Ensure Word preserves the font family element
    rPr = run._r.get_or_add_rPr()
    rFonts = OxmlElement('w:rFonts')
    rFonts.set(qn('w:ascii'), font_name)
    rFonts.set(qn('w:hAnsi'), font_name)
    rFonts.set(qn('w:cs'), font_name)
    rPr.append(rFonts)

def add_styled_heading(doc, text, level=1):
    h = doc.add_heading(text, level=level)
    h.paragraph_format.keep_with_next = True
    h.paragraph_format.space_before = Pt(16 if level == 1 else 12)
    h.paragraph_format.space_after = Pt(4)
    for run in h.runs:
        if level == 1:
            apply_font(run, FONT_PRIMARY, 16, bold=True, color_rgb=COLOR_SLATE_900)
        elif level == 2:
            apply_font(run, FONT_PRIMARY, 13, bold=True, color_rgb=COLOR_BLUE_900)
        elif level == 3:
            apply_font(run, FONT_PRIMARY, 11, bold=True, color_rgb=COLOR_BLUE_600)
    return h

def add_body_paragraph(doc, text="", bold_prefix=None, space_after=4, bullet=False):
    if bullet:
        p = doc.add_paragraph(style='List Bullet')
    else:
        p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15

    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        apply_font(r_pre, FONT_PRIMARY, 10, bold=True, color_rgb=COLOR_SLATE_900)
    if text:
        r_txt = p.add_run(text)
        apply_font(r_txt, FONT_PRIMARY, 10, color_rgb=COLOR_BODY)
    return p

def add_callout_box(doc, tag, title, body_text, bg_color=HEX_CALLOUT_BG, border_color=HEX_CALLOUT_BORDER):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)

    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
            <w:top w:val="none"/>
            <w:right w:val="none"/>
            <w:bottom w:val="none"/>
        </w:tcBorders>
    ''')
    cell._tc.get_or_add_tcPr().append(borders)

    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15

    r_tag = p.add_run(f"[{tag}] ")
    apply_font(r_tag, FONT_PRIMARY, 9.5, bold=True, color_rgb=COLOR_BLUE_900)

    r_title = p.add_run(f"{title}: ")
    apply_font(r_title, FONT_PRIMARY, 9.5, bold=True, color_rgb=COLOR_SLATE_900)

    r_body = p.add_run(body_text)
    apply_font(r_body, FONT_PRIMARY, 9.5, color_rgb=COLOR_BODY)

    doc.add_paragraph().paragraph_format.space_after = Pt(2)

def format_table_header(row, col_titles, col_widths=None):
    for idx, title in enumerate(col_titles):
        cell = row.cells[idx]
        set_cell_background(cell, HEX_HEADER_BG)
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(title)
        apply_font(r, FONT_PRIMARY, 9, bold=True, color_rgb=RGBColor(255, 255, 255))
        if col_widths and idx < len(col_widths):
            cell.width = col_widths[idx]

def add_table_data_row(tbl, values, is_even=False, col_widths=None):
    row = tbl.add_row()
    bg_color = HEX_ROW_EVEN if is_even else HEX_ROW_ODD
    for idx, val in enumerate(values):
        cell = row.cells[idx]
        set_cell_background(cell, bg_color)
        set_cell_margins(cell, top=90, bottom=90, left=140, right=140)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(val)
        apply_font(r, FONT_PRIMARY, 8.5, bold=(idx == 0), color_rgb=COLOR_BODY)
        if col_widths and idx < len(col_widths):
            cell.width = col_widths[idx]
    return row

def generate_script_document():
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
        hrun = hp.add_run("HackGrid Platform • Live Demonstration Script & User Journey")
        apply_font(hrun, FONT_PRIMARY, 8.5, color_rgb=COLOR_MUTED)

        # Footer
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        frun = fp.add_run("PCCOE Pune • DevOps & Cloud Architecture Demonstration Script")
        apply_font(frun, FONT_PRIMARY, 8.5, color_rgb=COLOR_MUTED)

    # ----------------------------------------------------
    # DOCUMENT TITLE BLOCK
    # ----------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(12)
    title_p.paragraph_format.space_after = Pt(2)
    r_title = title_p.add_run("HackGrid Platform - Live Demonstration Script & User Journey")
    apply_font(r_title, FONT_PRIMARY, 22, bold=True, color_rgb=COLOR_SLATE_900)

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(10)
    r_sub = sub_p.add_run("Step-by-Step Evaluator Script for End-to-End Live Demonstrations: Participant Workflow through High-Privileged Administrator & Judge Evaluation")
    apply_font(r_sub, FONT_PRIMARY, 11, italic=True, color_rgb=COLOR_BLUE_600)

    # Metadata Table
    meta_tbl = doc.add_table(rows=1, cols=4)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_widths = [Inches(1.75), Inches(1.75), Inches(1.75), Inches(1.75)]
    format_table_header(meta_tbl.rows[0], ["Document Type", "Security Model", "Access Paradigm", "Color & Styling"], meta_widths)
    add_table_data_row(meta_tbl, [
        "Live Demonstration Script",
        "Edge RBAC + TOTP MFA",
        "Dual-Phase (User / Admin)",
        "Strict Monochromatic / Blue"
    ], is_even=False, col_widths=meta_widths)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_callout_box(doc, "DEMONSTRATION OBJECTIVE", "Scope and Execution Strategy",
        "This document provides an exacting, click-by-click demonstration script for showcasing the HackGrid platform to faculty evaluators and technical juries. "
        "The script enforces absolute fidelity to the production UI: zero emojis, professional institutional typography in Google Sans, explicit element targeting, "
        "and clear demarcations between public participant interactions and restricted administrator capabilities. "
        "Presenters should proceed linearly from Section 1 (Participant) through Section 2 (Administrator).",
        bg_color=HEX_NOTE_BG, border_color=HEX_NOTE_BORDER
    )

    # ----------------------------------------------------
    # EXECUTIVE DEMO PRE-FLIGHT CHECKLIST
    # ----------------------------------------------------
    add_styled_heading(doc, "Pre-Flight Environment & System Readiness", level=2)
    add_body_paragraph(doc, "Verify the following local microservice states prior to beginning the live demonstration:")
    add_body_paragraph(doc, "Ensure the Express microservices engine is active on port 5000 (node backend/dist/index.js). Verify health at http://localhost:5000/api/health.", bold_prefix="1. Backend Health Check: ", bullet=True)
    add_body_paragraph(doc, "Confirm the Next.js 16 frontend is active on port 3000 (npm run dev). Open http://localhost:3000 in an incognito or fresh browser window.", bold_prefix="2. Frontend Dev Server: ", bullet=True)
    add_body_paragraph(doc, "Verify Prometheus metrics exposition at http://localhost:5000/metrics (confirming http_requests_total counter registration).", bold_prefix="3. Observability Pipeline: ", bullet=True)
    add_body_paragraph(doc, "Ensure clear session cookies by visiting /login to ensure unauthenticated state for Phase 1.", bold_prefix="4. State Sanitization: ", bullet=True)

    # ----------------------------------------------------
    # PHASE 1: PARTICIPANT JOURNEY (THE HACKER)
    # ----------------------------------------------------
    add_styled_heading(doc, "Phase 1: Participant Journey (The Hacker)", level=1)
    add_body_paragraph(doc, 
        "Phase 1 demonstrates the end-to-end workflow of a registered student hackathon participant ('The Hacker'). "
        "The participant authenticates, forms a project team with a cryptographically generated join code, browses hackathons, "
        "submits project deliverables with Zod schema enforcement, receives an immutable SHA-256 locked receipt, and tracks competition standings."
    )

    # Step 1.1
    add_styled_heading(doc, "Step 1.1: Landing & Participant Authentication (/login)", level=2)
    add_body_paragraph(doc, "Navigate the browser directly to: http://localhost:3000/login (or visit http://localhost:3000 which automatically redirects unauthenticated users to /login via Edge middleware).", bold_prefix="Target URL: ")

    p1_step1_tbl = doc.add_table(rows=1, cols=4)
    p1_step1_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    step_widths = [Inches(1.2), Inches(2.2), Inches(2.1), Inches(1.5)]
    format_table_header(p1_step1_tbl.rows[0], ["Action #", "User Interaction & Input", "Exact UI Element Targeted", "System Verification"], step_widths)

    add_table_data_row(p1_step1_tbl, [
        "1.1.1",
        "Inspect the split-screen landing interface",
        "Left: Dark slate branding banner with text 'HACKGRID', 'Ideas. Teams. Impact.', and feature highlights.\nRight: White container titled 'Sign in to HackGrid'.",
        "UI layout conforms strictly to monochromatic/blue design with zero emojis."
    ], False, step_widths)

    add_table_data_row(p1_step1_tbl, [
        "1.1.2",
        "Option A: Click GitHub OAuth Button",
        "Locate the dark button labeled 'Continue with GitHub' with GitHub SVG vector icon.",
        "Triggers NextAuth GitHub OAuth provider exchange."
    ], True, step_widths)

    add_table_data_row(p1_step1_tbl, [
        "1.1.3",
        "Option B: Enter Participant Email for Magic Link",
        "Click the input field with placeholder 'Enter your email address' under 'Sign in with email (magic link)'. Enter: student@pccoe.edu.",
        "Zod/regex validates valid email structure."
    ], False, step_widths)

    add_table_data_row(p1_step1_tbl, [
        "1.1.4",
        "Submit Magic Link Form",
        "Click the blue button labeled 'Send magic link' with right-arrow icon.",
        "NextAuth dispatches verification token via SMTP; updates button state to 'Sending...' then shows confirmation."
    ], True, step_widths)

    add_callout_box(doc, "PRESENTER SPEAKING POINT", "Strict RBAC Boundary Demonstration",
        "'Notice that as a participant, the application sidebar displays only four items: Events, Team, Submit, and Leaderboard. "
        "The administrative dashboard link (/admin) is completely hidden and guarded at the Next.js Edge middleware level. "
        "Any direct attempts to type /admin or /admin/submissions in the browser URL bar will result in immediate redirection to /team.'",
        bg_color=HEX_CALLOUT_BG, border_color=HEX_CALLOUT_BORDER
    )

    # Step 1.2
    add_styled_heading(doc, "Step 1.2: Team Workspace - Empty State & Team Formation (/team)", level=2)
    add_body_paragraph(doc, "Upon authentication, the user is redirected to http://localhost:3000/team. Because the user has not yet joined or created a team, the application renders a clean empty state card.", bold_prefix="Target URL: ")

    p1_step2_tbl = doc.add_table(rows=1, cols=4)
    p1_step2_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table_header(p1_step2_tbl.rows[0], ["Action #", "User Interaction & Input", "Exact UI Element Targeted", "System Verification"], step_widths)

    add_table_data_row(p1_step2_tbl, [
        "1.2.1",
        "Inspect Empty State UI",
        "Center card displaying puzzle collaboration SVG illustration, heading 'You're not in a team yet', and subtitle 'Team up with like-minded peers and start building your idea together.'",
        "Confirms dynamic user state calculation (hasTeam = false)."
    ], False, step_widths)

    add_table_data_row(p1_step2_tbl, [
        "1.2.2",
        "Trigger Team Creation Modal",
        "Click the solid blue button labeled 'Create team' (accompanied by a plus icon).",
        "Modal overlay backdrop appears with title 'Create a New Team'."
    ], True, step_widths)

    add_table_data_row(p1_step2_tbl, [
        "1.2.3",
        "Enter Team Name",
        "Click input field labeled 'Team name *' (placeholder: 'e.g. CyberKnights or Quantum Forge'). Type: CyberKnights AI.",
        "Captures dynamic team identifier."
    ], False, step_widths)

    add_table_data_row(p1_step2_tbl, [
        "1.2.4",
        "Select Event from Dropdown",
        "Click the dropdown select labeled 'Select event *'. Choose: 'Campus Innovation Sprint 2026'.",
        "Binds team to active hackathon cohort."
    ], True, step_widths)

    add_table_data_row(p1_step2_tbl, [
        "1.2.5",
        "Enter Project Pitch / Description",
        "Click textarea labeled 'Team description / Project pitch *'. Type: Autonomous multi-agent cloud security and compliance scanner for Kubernetes microservices.",
        "Validates non-empty pitch string."
    ], False, step_widths)

    add_table_data_row(p1_step2_tbl, [
        "1.2.6",
        "Submit Team Creation",
        "Click the blue modal submit button labeled 'Create team' in the bottom-right corner.",
        "Generates a unique 6-character cryptographic join code (e.g., 'FUYCHN'), assigns user as Team Lead, and stores record in Firestore."
    ], True, step_widths)

    # Step 1.3
    add_styled_heading(doc, "Step 1.3: Active Team Workspace & Milestone Verification (/team)", level=2)
    add_body_paragraph(doc, "The workspace automatically re-renders without full page reload, displaying the live team management portal.", bold_prefix="Workspace State: ")

    p1_step3_tbl = doc.add_table(rows=1, cols=4)
    p1_step3_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table_header(p1_step3_tbl.rows[0], ["Action #", "User Interaction & Input", "Exact UI Element Targeted", "System Verification"], step_widths)

    add_table_data_row(p1_step3_tbl, [
        "1.3.1",
        "Verify Team Identity Header",
        "Inspect top banner card: Purple avatar box showing letter 'C', team title 'CyberKnights AI', event tag 'Campus Innovation Sprint 2026', and '1 members • Team'.",
        "Confirms dynamic data binding from database."
    ], False, step_widths)

    add_table_data_row(p1_step3_tbl, [
        "1.3.2",
        "Inspect Dynamic Progress Bar",
        "Right-hand card: 'Submission progress' bar showing '33%' complete based on milestone calculation.",
        "Calculates completion percentage dynamically based on state."
    ], True, step_widths)

    add_table_data_row(p1_step3_tbl, [
        "1.3.3",
        "Verify Team Lead Member Roster",
        "Left column: 'Team members' list showing lead member avatar, user name, and blue badge 'Team Lead'.",
        "RBAC confirms captain ownership rights."
    ], False, step_widths)

    add_table_data_row(p1_step3_tbl, [
        "1.3.4",
        "Test Invite Code Clipboard Copy",
        "Click the dashed blue button labeled 'Invite member (Code: FUYCHN)' with plus icon.",
        "Copies code to clipboard; button text changes to 'Code Copied to Clipboard!' for 2000ms."
    ], True, step_widths)

    add_table_data_row(p1_step3_tbl, [
        "1.3.5",
        "Verify Milestones Checklist",
        "Right column: 'Upcoming milestones':\n- Milestone 1: 'Form team and choose event' -> 'Completed' (Green checkmark)\n- Milestone 2: 'Add repository link and details' -> 'Pending'\n- Milestone 3: 'Submit final project' -> 'Pending'",
        "Shows dynamic milestone progression."
    ], False, step_widths)

    add_table_data_row(p1_step3_tbl, [
        "1.3.6",
        "Navigate to Project Submission",
        "Click the solid blue button at the bottom of the milestones card labeled 'Go to Project Submission' with right-arrow icon (or click 'Submit' in sidebar).",
        "Transfers routing to http://localhost:3000/submit."
    ], True, step_widths)

    # Step 1.4
    add_styled_heading(doc, "Step 1.4: Project Deliverable Submission (/submit)", level=2)
    add_body_paragraph(doc, "The participant arrives at the submission portal to enter technical artifacts and upload their presentation deck.", bold_prefix="Target URL: ")

    p1_step4_tbl = doc.add_table(rows=1, cols=4)
    p1_step4_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table_header(p1_step4_tbl.rows[0], ["Action #", "User Interaction & Input", "Exact UI Element Targeted", "System Verification"], step_widths)

    add_table_data_row(p1_step4_tbl, [
        "1.4.1",
        "Verify Header & Deadline Card",
        "Inspect top banner: Event name 'Campus Innovation Sprint 2026', 'Deadline: 18 Oct 2026', and 'Submission progress: 0 of 3 complete'.",
        "Initializes form state."
    ], False, step_widths)

    add_table_data_row(p1_step4_tbl, [
        "1.4.2",
        "Enter Project Title",
        "Click input labeled 'Project title *' (placeholder: 'Enter your project title'). Type: CloudGuard SRE Engine.",
        "Right checklist item 1 ('Project details') monitors character length (min 3 chars)."
    ], True, step_widths)

    add_table_data_row(p1_step4_tbl, [
        "1.4.3",
        "Enter Project Description",
        "Click textarea labeled 'Project description *'. Type: Automated anomaly detection and self-healing engine for Kubernetes clusters utilizing Prometheus metric streams and SLO error budgets.",
        "Right checklist item 1 transitions to 'Completed' (Green checkmark)."
    ], False, step_widths)

    add_table_data_row(p1_step4_tbl, [
        "1.4.4",
        "Enter GitHub Repository URL",
        "Click input labeled 'GitHub repository URL *' (with link icon). Type: https://github.com/cyberknights/cloudguard-sre.",
        "Zod regex validates github.com domain; checklist item 2 ('Repository link') transitions to 'Completed'."
    ], True, step_widths)

    add_table_data_row(p1_step4_tbl, [
        "1.4.5",
        "Enter Live Demo URL (Optional)",
        "Click input labeled 'Live demo URL (optional)'. Type: https://cloudguard-sre.vercel.app.",
        "Stores staging application endpoint."
    ], False, step_widths)

    add_table_data_row(p1_step4_tbl, [
        "1.4.6",
        "Upload Presentation PDF",
        "Click the dashed upload zone labeled 'Choose file or drag and drop (PDF only, max 10 MB)'. Select: FA1_DevOps_Quick_Notes.pdf.",
        "Validates MIME type application/pdf and size <= 10MB; displays filename and size in blue; checklist item 3 transitions to 'Completed'."
    ], True, step_widths)

    add_table_data_row(p1_step4_tbl, [
        "1.4.7",
        "Verify 100% Progress Completion",
        "Inspect top progress meter: Displays '3 of 3 complete' with progress bar at 100% width.",
        "Enables submission button without validation errors."
    ], False, step_widths)

    add_table_data_row(p1_step4_tbl, [
        "1.4.8",
        "Execute Project Submission",
        "Click the blue button labeled 'Submit project' centered at the bottom of the page.",
        "Dispatches multipart payload to Express backend /api/upload, writes Firestore document, calculates Web Crypto SHA-256 hash, and transitions UI to Locked Receipt."
    ], True, step_widths)

    # Step 1.5
    add_styled_heading(doc, "Step 1.5: Locked Verification Receipt & Cryptographic Seal", level=2)
    add_body_paragraph(doc, "Once submitted, the editable form is permanently replaced by the immutable Verification Receipt component.", bold_prefix="Receipt Verification: ")

    p1_step5_tbl = doc.add_table(rows=1, cols=4)
    p1_step5_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table_header(p1_step5_tbl.rows[0], ["Action #", "User Interaction & Input", "Exact UI Element Targeted", "System Verification"], step_widths)

    add_table_data_row(p1_step5_tbl, [
        "1.5.1",
        "Inspect Sealed Status Badge",
        "Green badge at top of card: 'SUBMISSION VERIFIED & LOCKED' with shield icon and subtitle 'Cryptographically Sealed • Submission Deadline Met'.",
        "Guarantees deliverables cannot be tampered with post-submission."
    ], False, step_widths)

    add_table_data_row(p1_step5_tbl, [
        "1.5.2",
        "Verify Metadata & File Proof",
        "Displays Submission ID (e.g., 'SUB-2026-X9B2K1'), submission timestamp, linked GitHub repository URL, and downloadable PDF asset link.",
        "Confirms data persistence in storage."
    ], True, step_widths)

    add_table_data_row(p1_step5_tbl, [
        "1.5.3",
        "Verify SHA-256 Cryptographic Hash",
        "Inspect the dark monospace box labeled 'SHA-256 Digital Verification Fingerprint': displays 64-character hexadecimal digest (e.g., 'd2c9a7f4e8b6c3d1...').",
        "Validates genuine SHA-256 digest computed across submission payload via window.crypto.subtle."
    ], False, step_widths)

    add_table_data_row(p1_step5_tbl, [
        "1.5.4",
        "Navigate to Competition Leaderboard",
        "Click the link button labeled 'View Standings on Leaderboard' (or click 'Leaderboard' in left sidebar navigation).",
        "Redirects to http://localhost:3000/leaderboard."
    ], True, step_widths)

    # Step 1.6
    add_styled_heading(doc, "Step 1.6: Competition Standings & Leaderboard (/leaderboard)", level=2)
    add_body_paragraph(doc, "Participants monitor real-time rankings and scores as evaluations are finalized by judges.", bold_prefix="Target URL: ")

    p1_step6_tbl = doc.add_table(rows=1, cols=4)
    p1_step6_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table_header(p1_step6_tbl.rows[0], ["Action #", "User Interaction & Input", "Exact UI Element Targeted", "System Verification"], step_widths)

    add_table_data_row(p1_step6_tbl, [
        "1.6.1",
        "Inspect Event Selector Dropdown",
        "Dropdown in upper right defaulted to 'Campus Innovation Sprint 2026'.",
        "Filters leaderboard scores by active competition."
    ], False, step_widths)

    add_table_data_row(p1_step6_tbl, [
        "1.6.2",
        "Inspect Top 3 Podium Cards",
        "Three elevated podium cards:\n- Rank 1 (Gold #1 badge): 'Pixel Pioneers', Score '942 points', Track 'Sustainability'\n- Rank 2 (Silver #2 badge): 'Code Catalyst', Score '918 points', Track 'AI for Social Impact'\n- Rank 3 (Bronze #3 badge): 'GreenStack', Score '891 points', Track 'Sustainability'",
        "Renders top three finalists based on real-time descending score calculation."
    ], True, step_widths)

    add_table_data_row(p1_step6_tbl, [
        "1.6.3",
        "Inspect Full Rankings Table",
        "Data table below podium with columns: '#' (Rank), 'Team', 'Score', and 'Track'. Shows complete participant cohort.",
        "Synchronized with Firestore 'leaderboard' collection."
    ], False, step_widths)

    add_table_data_row(p1_step6_tbl, [
        "1.6.4",
        "Participant Logout",
        "Click the user profile avatar in the top-right header, select 'Sign out' from dropdown.",
        "Purges session tokens, wipes authentication cookies, and returns browser to /login."
    ], True, step_widths)

    # ----------------------------------------------------
    # PHASE 2: ADMINISTRATOR JOURNEY (THE ORGANIZER / JUDGE)
    # ----------------------------------------------------
    add_styled_heading(doc, "Phase 2: Administrator Journey (The Organizer / Judge)", level=1)
    add_body_paragraph(doc, 
        "Phase 2 demonstrates the administrative and evaluative capabilities of the portal from the perspective of a high-privileged Faculty Administrator and Judge ('The Organizer/Judge'). "
        "The administrator bypasses standard participant routes, completes multi-factor TOTP authentication with brute-force rate limiting, "
        "reviews submitted deliverables, executes rubric evaluations with dynamic score calculation, and audits cluster telemetry in Grafana."
    )

    # Step 2.1
    add_styled_heading(doc, "Step 2.1: Manual Administrative Route Ingress (/admin/login)", level=2)
    add_body_paragraph(doc, "Because the 'Admin' link is intentionally hidden from unauthenticated and participant viewports, the administrator must manually enter the administrative route.", bold_prefix="Ingress Action: ")

    p2_step1_tbl = doc.add_table(rows=1, cols=4)
    p2_step1_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table_header(p2_step1_tbl.rows[0], ["Action #", "User Interaction & Input", "Exact UI Element Targeted", "System Verification"], step_widths)

    add_table_data_row(p2_step1_tbl, [
        "2.1.1",
        "Direct Browser URL Ingress",
        "In the browser address bar, type: http://localhost:3000/admin/login and press Enter.",
        "Edge middleware recognizes administrative auth path and renders the cybersecurity-themed portal."
    ], False, step_widths)

    add_table_data_row(p2_step1_tbl, [
        "2.1.2",
        "Inspect Cybersecurity UI Elements",
        "Dark slate glassmorphism container featuring shield badge, title 'Restricted Access', subtitle 'Event Management Portal', and badges 'Multi-Factor Authentication', 'Rate Limiting: 5 req/min', 'TLS 1.3'.",
        "Visual feedback confirms high-security zone."
    ], True, step_widths)

    add_table_data_row(p2_step1_tbl, [
        "2.1.3",
        "Enter Administrator Email",
        "Click input field labeled 'Email address' (placeholder: 'admin@example.com'). Type: admin@hackgrid.internal.",
        "Captures faculty admin ID."
    ], False, step_widths)

    add_table_data_row(p2_step1_tbl, [
        "2.1.4",
        "Enter Security Key / Password",
        "Click input field labeled 'Password'. Type: PCCOE-DevOps-2026. (Click the eye icon to verify masked/unmasked state).",
        "Monospace password input."
    ], True, step_widths)

    add_table_data_row(p2_step1_tbl, [
        "2.1.5",
        "Enter 6-Digit TOTP Authenticator Code",
        "Click the first of six discrete numeric boxes under 'Authenticator code (TOTP)'. Type: 123456 (or paste a 6-digit code).",
        "Auto-tabbing advances focus across all 6 boxes automatically."
    ], False, step_widths)

    add_table_data_row(p2_step1_tbl, [
        "2.1.6",
        "Execute Admin MFA Verification",
        "Click the solid blue button labeled 'Sign in' with right-arrow icon.",
        "Issues POST to /api/admin/verify. Backend rate limiter checks attempt count (<5/min), issues cryptographic token, sets admin_session=true cookie, and redirects to /admin/submissions."
    ], True, step_widths)

    add_callout_box(doc, "SECURITY & SRE ENFORCEMENT", "Brute-Force Rate Limiting (HTTP 429)",
        "The Express backend incorporates an in-memory sliding window rate limiter on /api/admin/verify. "
        "If more than 5 failed authentication attempts are detected from a client IP within 60 seconds, "
        "the endpoint immediately rejects requests with HTTP 429 (Too Many Requests), returns a 'Retry-After: 60' header, "
        "and logs a security alert to the ELK audit pipeline. Demonstrating wrong credentials 5 times will trigger this safeguard.",
        bg_color=HEX_WARN_BG, border_color=HEX_WARN_BORDER
    )

    # Step 2.2
    add_styled_heading(doc, "Step 2.2: Submissions Management Grid (/admin/submissions)", level=2)
    add_body_paragraph(doc, "Upon successful MFA authorization, the administrator lands on the master submissions management interface.", bold_prefix="Target URL: ")

    p2_step2_tbl = doc.add_table(rows=1, cols=4)
    p2_step2_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table_header(p2_step2_tbl.rows[0], ["Action #", "User Interaction & Input", "Exact UI Element Targeted", "System Verification"], step_widths)

    add_table_data_row(p2_step2_tbl, [
        "2.2.1",
        "Verify 4 Top KPI Metric Cards",
        "Inspect metric counters at top of screen:\n- Total submissions: 4\n- Valid submissions: 2 (Green check icon)\n- Under review: 2 (Amber clock icon)\n- Disqualified: 0 (Red X icon)",
        "Calculates live counts across submissions dataset."
    ], False, step_widths)

    add_table_data_row(p2_step2_tbl, [
        "2.2.2",
        "Test Real-Time Search Filter",
        "Click search input field labeled 'Search by team name, project title...'. Type: Pixel.",
        "Table instantaneously filters to display only 'Pixel Pioneers' (CropSense project)."
    ], True, step_widths)

    add_table_data_row(p2_step2_tbl, [
        "2.2.3",
        "Clear Search Filter",
        "Select all text in search bar and press Backspace.",
        "Table immediately restores full list of submissions."
    ], False, step_widths)

    add_table_data_row(p2_step2_tbl, [
        "2.2.4",
        "Filter by Submission Status",
        "Click the status dropdown currently showing 'All status'. Select: 'Valid'.",
        "Table re-filters showing only submissions marked with the green 'Valid' badge."
    ], True, step_widths)

    add_table_data_row(p2_step2_tbl, [
        "2.2.5",
        "Export Submissions Dataset to CSV",
        "Click the white outlined button labeled 'Export CSV' with download icon.",
        "Generates dynamic client-side CSV file (HackGrid_Submissions_YYYY-MM-DD.csv) and initiates immediate browser download."
    ], False, step_widths)

    add_table_data_row(p2_step2_tbl, [
        "2.2.6",
        "Test 3-Dot Context Menu Actions",
        "On any submission row, click the three vertical dots ('...') icon button on the right edge.",
        "Opens contextual action menu with options: 'Mark as valid', 'Disqualify', and 'Delete submission'."
    ], True, step_widths)

    add_table_data_row(p2_step2_tbl, [
        "2.2.7",
        "Trigger Judging Rubric Evaluation",
        "On the first submission row (Pixel Pioneers - CropSense), click the 'Eye' icon button labeled 'Evaluate submission'.",
        "Navigates directly to the Judge Evaluation page: http://localhost:3000/judge/evaluate/sub-1."
    ], False, step_widths)

    # Step 2.3
    add_styled_heading(doc, "Step 2.3: Judging Rubric & Dynamic Scoring Matrix (/judge/evaluate/[id])", level=2)
    add_body_paragraph(doc, "The judge evaluation interface provides a split-screen viewport separating project evidence from the quantitative scoring matrix.", bold_prefix="Target URL: ")

    p2_step3_tbl = doc.add_table(rows=1, cols=4)
    p2_step3_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table_header(p2_step3_tbl.rows[0], ["Action #", "User Interaction & Input", "Exact UI Element Targeted", "System Verification"], step_widths)

    add_table_data_row(p2_step3_tbl, [
        "2.3.1",
        "Inspect Project Context Pane (Right)",
        "Review project metadata: Title 'CropSense', Team 'Pixel Pioneers', team member count, project pitch, clickable GitHub repository link, Live demo URL, and PDF download action.",
        "Provides judges with all submitted technical evidence."
    ], False, step_widths)

    add_table_data_row(p2_step3_tbl, [
        "2.3.2",
        "Inspect Initial Aggregate Score",
        "Upper right of Left Pane: Displays blue container showing 'Total Score: 79 / 100'.",
        "Computed dynamically from criteria sum (25+22+20+12)."
    ], True, step_widths)

    add_table_data_row(p2_step3_tbl, [
        "2.3.3",
        "Adjust Criterion 1: Innovation (Max 30)",
        "Click the numeric input under 'Innovation & Originality'. Change value from 25 to 28.",
        "Total score instantly updates from 79 to 82; progress bar expands to (28/30 * 100)%."
    ], False, step_widths)

    add_table_data_row(p2_step3_tbl, [
        "2.3.4",
        "Adjust Criterion 2: Technical Execution (Max 30)",
        "Click numeric input under 'Technical Execution'. Change value from 22 to 27.",
        "Total score instantly increments to 87."
    ], True, step_widths)

    add_table_data_row(p2_step3_tbl, [
        "2.3.5",
        "Adjust Criteria 3 & 4: Impact (25) & Presentation (15)",
        "Verify 'Impact & Feasibility' (20/25) and 'Presentation & Demo' (12/15).",
        "Total score locks dynamically at exactly: 87 / 100."
    ], False, step_widths)

    add_table_data_row(p2_step3_tbl, [
        "2.3.6",
        "Enter Constructive Qualitative Feedback",
        "Click textarea labeled 'Overall feedback (optional)'. Type: Outstanding technical implementation with robust microservice architecture and genuine real-world agricultural impact.",
        "Monitors character counter (max 500 characters)."
    ], True, step_widths)

    add_table_data_row(p2_step3_tbl, [
        "2.3.7",
        "Submit Evaluation & Lock Scores",
        "Click the solid blue button labeled 'Submit evaluation' with send icon in bottom-right corner.",
        "Updates Firestore leaderboard collection, marks submission as Approved, displays green confirmation banner, and redirects back to /admin/submissions."
    ], False, step_widths)

    # Step 2.4
    add_styled_heading(doc, "Step 2.4: Admin Dashboard & Telemetry Verification (/admin)", level=2)
    add_body_paragraph(doc, "The administrator visits the high-level executive dashboard and observability telemetry suite.", bold_prefix="Navigation: ")

    p2_step4_tbl = doc.add_table(rows=1, cols=4)
    p2_step4_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table_header(p2_step4_tbl.rows[0], ["Action #", "User Interaction & Input", "Exact UI Element Targeted", "System Verification"], step_widths)

    add_table_data_row(p2_step4_tbl, [
        "2.4.1",
        "Navigate to Executive Dashboard",
        "In the browser URL bar or sidebar navigation, click/navigate to: http://localhost:3000/admin.",
        "Renders executive dashboard."
    ], False, step_widths)

    add_table_data_row(p2_step4_tbl, [
        "2.4.2",
        "Verify Executive KPI Metrics",
        "Review top 3 KPI cards:\n- Registrations: 248\n- Teams: 62\n- Submissions: 48",
        "Confirms aggregation across full competition cohort."
    ], True, step_widths)

    add_table_data_row(p2_step4_tbl, [
        "2.4.3",
        "Verify Audit Trail & Activity Feed",
        "Left table 'Recent activity': Review real-time activity entries ('Team created - Pixel Pioneers', 'Submission updated', 'New registration - Meera Kulkarni').",
        "Corresponds with ELK audit log stream."
    ], False, step_widths)

    add_table_data_row(p2_step4_tbl, [
        "2.4.4",
        "Navigate to Grafana Observability Portal",
        "In browser address bar, navigate to: http://localhost:3000/admin/grafana (or open /grafana-dashboard.html).",
        "Loads the integrated Grafana Observability & Infrastructure Telemetry dashboard."
    ], True, step_widths)

    add_table_data_row(p2_step4_tbl, [
        "2.4.5",
        "Inspect Prometheus Live Scrape Status",
        "Header badge in Grafana: Displays pulsating green indicator 'Prometheus Live Scrape Active (5s)' and Kubernetes namespace 'hackathon'.",
        "Confirms active Prometheus scraper polling backend on port 5000."
    ], False, step_widths)

    add_table_data_row(p2_step4_tbl, [
        "2.4.6",
        "Verify SRE Telemetry Metrics",
        "Inspect telemetry charts:\n- Request Throughput (QPS)\n- P95 / P99 Latency curves (<250ms target)\n- Kubernetes Pod Health (frontend 3/3, backend 2/2 replicas)\n- SRE Error Budget Burn Rate (remaining budget 41.2%)",
        "Verifies compliance with SRE SLO definitions (sre/slo-definitions.yaml)."
    ], True, step_widths)

    add_table_data_row(p2_step4_tbl, [
        "2.4.7",
        "Verify Admin Sidebar Privilege",
        "Look at the left navigation rail: confirm that 'Admin' (with settings icon) is visible exclusively during active admin sessions.",
        "Confirms RBAC claim in AuthContext and document.cookie."
    ], False, step_widths)

    add_table_data_row(p2_step4_tbl, [
        "2.4.8",
        "Administrator Teardown & Sign Out",
        "Click the admin avatar in top-right header, select 'Sign out'.",
        "Wipes adminSessionToken from sessionStorage, expires admin_session cookie, and forces browser redirect back to /login."
    ], True, step_widths)

    # ----------------------------------------------------
    # SECTION 3: DEMONSTRATION FAQ & EVALUATION MATRIX
    # ----------------------------------------------------
    add_styled_heading(doc, "Demonstration Evaluation Matrix & Defense FAQ", level=1)
    add_body_paragraph(doc, "Key questions and defense points for faculty review during the live demonstration:")

    add_body_paragraph(doc, 
        "The application employs Next.js Edge Middleware (src/middleware.ts) that intercepts all incoming HTTP requests before page hydration. "
        "The cookie 'admin_session' is strictly validated. If a standard participant or unauthenticated user requests /admin or /admin/submissions, "
        "the middleware immediately rewrites the response with an HTTP 307 redirect to /team. Additionally, client components are wrapped with AdminRouteGuard.tsx as a defense-in-depth second layer.",
        bold_prefix="Q1: How is Role-Based Access Control (RBAC) enforced between Participants and Admins?\n"
    )

    add_body_paragraph(doc, 
        "During form submission (/submit), the client executes a SHA-256 digest using window.crypto.subtle across the concatenated unique submission ID, "
        "project title, GitHub URL, presentation filename, and server timestamp. This generates a 64-character hexadecimal fingerprint stored both in the database "
        "and rendered on the Locked Receipt. If any byte of the submission payload or file is altered post-deadline, the hash recalculation will mismatch, guaranteeing data integrity.",
        bold_prefix="Q2: How does the SHA-256 cryptographic receipt guarantee submission integrity?\n"
    )

    add_body_paragraph(doc, 
        "The Express backend (backend/src/index.ts) is instrumented with prom-client (backend/src/metrics.ts), tracking 'http_requests_total' and 'http_request_duration_seconds' histograms. "
        "Prometheus scrapes the backend every 5 seconds. In sre/slo-definitions.yaml, we declare our 99.90% availability SLO. "
        "If 5xx errors consume more than 2% of the error budget in 1 hour (14.4x burn rate), Prometheus and Alertmanager trigger critical on-call alerts and halt Canary rollouts in Kubernetes.",
        bold_prefix="Q3: How do the Prometheus metrics and SRE Error Budget burn rate alerts integrate?\n"
    )

    # Save Document
    output_filename = "HackGrid_Platform_Live_Demonstration_Script.docx"
    output_path = os.path.join(os.getcwd(), output_filename)
    doc.save(output_path)
    print(f"Demonstration script successfully created at: {output_path}")

if __name__ == "__main__":
    generate_script_document()
