import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.model.js"; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateAiResume = async (req, res) => {
  try {
    const { 
      fullName, email, phone, linkedin, github, jobTitle, experience, 
      projects, education, skills, city, country, 
      profileSummary, designation, photo,
      fontFormat, colorFormat, spacingFormat, userId,
      customSections
    } = req.body;

    // --- BILLING / QUOTA LOGIC ---
    if (!userId) {
      return res.status(401).json({ message: "Please log in to generate resumes." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found. Please log in again." });
    }

    const isPro = user.plan === "pro";
    const generationCount = user.get('aiResumeGenerations') || 0;

    if (!isPro && generationCount >= 2) {
      return res.status(403).json({
        message: "You have reached your limit of 2 free AI resume generations.",
        code: "LIMIT_REACHED"
      });
    }

    if (!fullName || !jobTitle || !skills) {
      return res.status(400).json({ message: "Name, Job Title, and Skills are required." });
    }

    // 1. DYNAMIC STYLES
    const baseFont = fontFormat || "'Inter', sans-serif";
    const accentColor = colorFormat || "#2563eb";
    const padding = spacingFormat === 'compact' ? '20px' : spacingFormat === 'spacious' ? '50px' : '40px';
    const lineHt = spacingFormat === 'compact' ? '1.4' : spacingFormat === 'spacious' ? '1.8' : '1.6';
    const marginBtm = spacingFormat === 'compact' ? '12px' : spacingFormat === 'spacious' ? '24px' : '16px';

    let dynamicCss = `
      :root {
        --primary-color: ${accentColor};
        --font-main: ${baseFont};
        --line-ht: ${lineHt};
        --spacing: ${padding};
        --margin-btm: ${marginBtm};
      }
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; background: transparent; }
      p { margin: 0 0 10px 0; }
      ul { margin: 5px 0 15px 20px; padding: 0; }
      li { margin-bottom: 6px; }
      .resume-master-container {
        font-family: var(--font-main);
        line-height: var(--line-ht);
        color: #334155;
        width: 100%;
        max-width: 850px;
        margin: 0 auto;
        background: #ffffff;
        padding: 50px; 
        min-height: 1100px;
      }
      .header-wrapper { display: flex; align-items: center; gap: 30px; background: #f8fafc; padding: 40px; border-radius: 16px; margin-bottom: 40px; border-left: 8px solid var(--primary-color); box-shadow: 0 4px 10px rgba(0,0,0,0.03);}
      .header-info { flex: 1; }
      .resume-header-name { font-size: 2.6rem; color: #0f172a; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px;}
      .resume-header-title { font-size: 1.2rem; color: var(--primary-color); font-weight: 600; margin-bottom: 12px;}
      .resume-contact { color: #475569; font-size: 0.95rem; line-height: 1.5; }
      .photo-container img { width: 140px; height: 140px; border-radius: 50%; object-fit: cover; border: 4px solid #ffffff; box-shadow: 0 10px 20px rgba(0,0,0,0.1);}
      .resume-section-title { font-size: 1.3rem; color: #0f172a; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; margin-top: 35px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;}
      .resume-section-title::before { content: ''; display: inline-block; width: 14px; height: 14px; background: var(--primary-color); border-radius: 4px; }
      .item-container { margin-bottom: 24px; padding-left: 26px; border-left: 2px solid #e2e8f0; position: relative;}
      .item-container::before { content: ''; position: absolute; left: -7px; top: 6px; width: 12px; height: 12px; background: #fff; border: 2px solid var(--primary-color); border-radius: 50%; }
      .item-header { font-size: 1.15rem; color: #0f172a; font-weight: 700; margin-bottom: 4px; }
      .item-meta { color: #64748b; font-size: 0.95rem; font-weight: 500; margin-bottom: 10px; }
      p { color: #334155; line-height: 1.6; font-size: 1rem; }
      ul { color: #334155; line-height: 1.6; padding-left: 20px; }
    `;

    // 2. DEFINE THE TEMPLATE STRUCTURES WITH PLACEHOLDERS
    let htmlInstructions = `
      <div class="resume-master-container">
         <div class="header-wrapper">
            [INJECT_PHOTO]
            <div class="header-info">
               <div class="resume-header-name">[INJECT_NAME]</div>
               <div class="resume-header-title">[INJECT_JOB_TITLE]</div>
               <div class="resume-contact">[INJECT_CONTACT]</div>
            </div>
         </div>
         
         [INJECT_SUMMARY_SECTION]
         [INJECT_SKILLS_SECTION]
         [INJECT_EXPERIENCE_SECTION]
         [INJECT_PROJECTS_SECTION]
         [INJECT_EDUCATION_SECTION]
         [INJECT_CUSTOM_SECTIONS]
      </div>
    `;

    // 3. ASK THE AI ONLY FOR JSON FORMATTED DATA (Prevents layout breakage)
    const prompt = `
      You are an expert resume formatter.
      I will provide raw resume data. Your task is to organize and format this data into a valid JSON object.
      
      REQUIREMENTS:
      - Return ONLY valid JSON.
      - The JSON must have these exact keys: "summary", "skills", "experience", "projects", "education", "customSections".
      - Do NOT include markdown formatting like \`\`\`json.
      
      DATA & FORMATTING RULES:
      1. "summary": Write a 3-sentence professional summary using this data: "${profileSummary}". (If empty, write a general summary for a ${jobTitle || designation}). Return plain text.
      2. "skills": Convert this list into an HTML unordered list (<ul><li>...</li></ul>): "${skills}". (If empty, return empty string "").
      3. "experience": Parse the raw experience data and format EACH job using this EXACT HTML structure:
          <div class="item-container">
            <div class="item-header">Job Title or Company</div>
            <div class="item-meta">Role | Dates | Location</div>
            <ul>
              <li>Action-driven responsibility or achievement</li>
            </ul>
          </div>
          Raw experience data: """${experience}"""
          (If empty, return empty string "").
      4. "projects": Parse the raw project data using the EXACT HTML structure as experience.
          Raw projects data: """${projects}"""
          (If empty, return empty string "").
      5. "education": Parse the raw education data using the EXACT HTML structure as experience.
          Raw education data: """${education}"""
          (If empty, return empty string "").
      6. "customSections": You will receive an array of custom section objects. Format them into a single continuous HTML string. 
          For each section object, prepend the title using exactly this HTML: <div class="resume-section-title">Section Title Here</div>, followed by the actual content formatted cleanly as an HTML list <ul><li>...</li></ul> or paragraphs <p>...</p>.
          Raw custom sections data: """${JSON.stringify(customSections || [])}"""
          (If the array is empty, return an empty string "").
    `;

    // Force AI to return structural JSON only
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1, 
      }
    });
    
    const result = await model.generateContent(prompt);
    let aiData;
    
    try {
      aiData = JSON.parse(result.response.text());
    } catch (e) {
      // Fallback cleanup if the model still adds markdown formatting
      const cleaned = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      aiData = JSON.parse(cleaned);
    }

    // 4. INJECT THE AI JSON CONTENT INTO OUR PERFECT HTML STRUCTURE
    const contactInfo = [city, country, email, phone, linkedin, github].filter(Boolean).join(' | ');

    let finalHtml = `
      <style>${dynamicCss}</style>
      ${htmlInstructions}
    `;

    finalHtml = finalHtml
      .replace('[INJECT_PHOTO]', photo ? `<div class="photo-container"><img src="${photo}" alt="Profile Photo"/></div>` : '')
      .replace('[INJECT_NAME]', fullName || 'Your Name')
      .replace('[INJECT_JOB_TITLE]', jobTitle || designation || 'Professional')
      .replace('[INJECT_CONTACT]', contactInfo)
      .replace('[INJECT_SUMMARY_SECTION]', aiData.summary ? `<div class="resume-section-title">Profile Summary</div><p>${aiData.summary}</p>` : '')
      .replace('[INJECT_SKILLS_SECTION]', aiData.skills ? `<div class="resume-section-title">Core Skills</div>${aiData.skills}` : '')
      .replace('[INJECT_EXPERIENCE_SECTION]', aiData.experience ? `<div class="resume-section-title">Professional Experience</div>${aiData.experience}` : '')
      .replace('[INJECT_PROJECTS_SECTION]', aiData.projects ? `<div class="resume-section-title">Projects</div>${aiData.projects}` : '')
      .replace('[INJECT_EDUCATION_SECTION]', aiData.education ? `<div class="resume-section-title">Education</div>${aiData.education}` : '')
      .replace('[INJECT_CUSTOM_SECTIONS]', aiData.customSections || '');

    // --- AFTER SUCCESSFUL GENERATION, UPDATE BILLING ---
    if (!isPro) {
      await User.updateOne({ _id: userId }, { $inc: { aiResumeGenerations: 1 } });
    }

    res.status(200).json({ success: true, resumeHtml: finalHtml });

  } catch (error) {
    console.error("AI Resume Generation Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to generate resume. Please try again." });
  }
};

// --- Write with AI (REAL AI LOGIC) ---
export const generateSectionAi = async (req, res) => {
  try {
    const { field, context } = req.body;
    
    if (!field || !context) {
      return res.status(400).json({ message: "Field and context are required." });
    }

    const prompt = `
      You are an expert resume writer and career coach. The user needs help writing the "${field}" section of their resume.
      
      Here is the information they have provided so far:
      - Name: ${context.fullName || 'Not provided'}
      - Target Job Title: ${context.jobTitle || context.designation || 'Not provided'}
      - Experience Level: ${context.experienceLevel || 'Not provided'}
      - Skills: ${context.skills || 'Not provided'}
      - Company: ${context.companyName || 'Not provided'}
      ${context.projectName ? `- Project Name: ${context.projectName}` : ''}
      
      Write a highly professional, impactful, and concise text for the "${field}" section. 
      Use action verbs, metrics (if implied or easily generalized), and industry-standard phrasing.
      
      If the field is "profileSummary", write a 3-4 sentence paragraph.
      If the field is "experience" or "projects", write 3-4 strong bullet points. Use standard bullet characters (•).
      
      Do NOT use markdown blocks like \`\`\` text. Do NOT return HTML. Return ONLY the plain text ready to be pasted into a textarea.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(prompt);
    let generatedText = result.response.text().trim();

    res.status(200).json({ success: true, generatedText });

  } catch (error) {
    console.error("AI Section Generation Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to generate section. Please try again." });
  }
};