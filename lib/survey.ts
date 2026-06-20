// Baseline survey instruments (SME / Agri-Tech / TSI paths), ported from the
// design prototype's `surveyDef(type)`.

import type { RespondentType, SurveyQuestion } from "./types";

export function surveyDef(type: RespondentType | string): SurveyQuestion[] {
  const scale5 = ["Very low", "Low", "Moderate", "High", "Very high"];
  const country = ["Indonesia", "The Philippines", "Other"];
  const gender = ["Woman", "Man", "Non-binary", "Prefer not to say", "Other"];
  const age = [
    "18–24 years",
    "25–34 years",
    "35–44 years",
    "45–54 years",
    "55+ years",
  ];
  const barriers = [
    "Capacity",
    "Geography",
    "Access to finance",
    "Digital access",
    "Other",
  ];

  if (type === "SME")
    return [
      { kind: "section", title: "Section A · Respondent information" },
      { id: "a_country", label: "What country do you work in?", kind: "radio", opts: country },
      { id: "a_sector", label: "What is the primary sector of your business?", kind: "radio", opts: ["Processed Food / Agri-food sector", "Primary Agriculture", "Agri-technology", "Other"] },
      { id: "a_position", label: "What is your current position?", kind: "radio", opts: ["SME staff", "SME manager", "SME Board member", "Other"] },
      { id: "a_gender", label: "Which gender do you identify with?", kind: "radio", opts: gender },
      { id: "a_age", label: "What age group do you belong to?", kind: "radio", opts: age },
      { id: "a_underrep", label: "Do you consider yourself a member of an underrepresented group? (e.g. Women, PWDs, Indigenous people, Youth)", kind: "radio", opts: ["Yes", "No"] },
      { id: "a_own", label: "Is this SME owned, led, or managed by individuals from any under-represented groups? (Select all that apply)", kind: "multi", opts: ["Youth (under 35 years old)", "Indigenous peoples / Ethnic minorities", "Persons with disabilities", "Rural / remote communities", "None of the above", "Prefer not to say"] },
      { kind: "section", title: "Section B · Economic growth" },
      { id: "b1_growth", label: "To what extent has your business experienced growth in each of the following areas?", kind: "matrix", rows: ["Export sales", "Employment", "Client base", "Market intervention", "Product innovation", "Process innovation"], scale: ["No growth at all", "Stayed the same", "Slight growth", "Moderate growth", "Significant growth", "Not applicable"] },
      { id: "b2_emp", label: "Please specify the nature of your employment growth (Select all that apply)", kind: "multi", opts: ["Increased total number of employees", "Maintained staff levels despite economic challenges", "Improved employment conditions (wages, safety, training)"] },
      { kind: "section", title: "Section C · International market access" },
      { id: "c1_export", label: "Does your business currently sell or export processed food products to international markets?", kind: "radio", opts: ["Yes, we currently export directly or indirectly", "No, but we are actively trying to enter international markets", "No, we only focus on the domestic market"] },
      { id: "c2_countries", label: "To which countries or regions do you currently export? (Select all that apply)", kind: "multi", opts: ["Canada", "Indonesia", "Philippines", "Other ASEAN countries", "Other global markets"] },
      { kind: "section", title: "Section D · Staff capacity — export readiness" },
      { id: "d2_identify", label: "How would you rate your capacity to identify market demands in the processed food sector?", kind: "radio", opts: scale5 },
      { id: "d3_respond", label: "How would you rate your capacity to respond to those market demands?", kind: "radio", opts: scale5 },
      { id: "d4_agree", label: '"Our SME has the necessary tools, skills, and market intelligence to successfully compete in regional/international processed food markets."', kind: "radio", opts: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"] },
      { id: "d5_meet", label: "How often have you engaged in strategic partnership development meetings with Canadian agri-business associations?", kind: "radio", opts: ["Never", "Rarely", "Sometimes", "Often", "Always"] },
      { kind: "section", title: "Section E · Staff capacity — climate resilience" },
      { id: "e2_climate", label: "How would you rate your capacity to integrate climate resilience measures into your operations?", kind: "radio", opts: scale5 },
      { kind: "section", title: "Section F · Open-ended (optional)" },
      { id: "f1_chal", label: "What challenges does your business face in delivering gender-responsive or climate-resilient services?", kind: "text" },
      { id: "f2_supp", label: "What support or training would most improve your capacity?", kind: "text" },
      { id: "f3_bar", label: "What are the main barriers SMEs face in accessing international markets? (Select all that apply)", kind: "multi", opts: barriers },
    ];

  if (type === "AgriTech")
    return [
      { kind: "section", title: "Section A · Respondent information" },
      { id: "a_country", label: "What country do you work in?", kind: "radio", opts: country },
      { id: "a_position", label: "What is your current position?", kind: "radio", opts: ["ATP staff", "ATP manager", "ATP Board member", "Organizational leader", "Other"] },
      { id: "a_gender", label: "Which gender do you identify with?", kind: "radio", opts: gender },
      { id: "a_age", label: "What age group do you belong to?", kind: "radio", opts: age },
      { id: "a_underrep", label: "Do you consider yourself a member of an underrepresented group?", kind: "radio", opts: ["Yes", "No"] },
      { kind: "section", title: "Section B · ATP module — tools, approaches & services" },
      { id: "b1_has", label: "Does your institution currently have any tools, approaches, or services to support SMEs in the processed food sector?", kind: "radio", opts: ["Yes", "No"] },
      { id: "b1_types", label: "Which types were implemented? (Select all that apply)", kind: "multi", opts: ["Climate-resilient testing protocols", "Gender-responsive service delivery tools", "Environmental sustainability strategies", "Climate change resilience strategies", "Climate Change Action Plans", "Gender Action Plans (GAPs)", "Digital diagnostic tools", "Training modules", "Other"] },
      { id: "b1_count", label: "How many tools/approaches or services do you currently have?", kind: "radio", opts: ["0", "1", "2", "3", "Other"] },
      { id: "b1_desc", label: "Please briefly describe each tool/service implemented.", kind: "text" },
      { kind: "section", title: "Section C · Staff capacity — GESI & climate resilience" },
      { id: "c21", label: "How would you rate your capacity to integrate GESI into your institution's structure and services?", kind: "radio", opts: scale5 },
      { id: "c22", label: "How would you rate your capacity to integrate climate resilience measures?", kind: "radio", opts: scale5 },
      { id: "c23", label: "How would you rate your ability to support SMEs in adopting climate-resilient practices?", kind: "radio", opts: scale5 },
      { id: "c24", label: "How would you rate your ability to design and implement inclusive, gender-responsive approaches in your service delivery?", kind: "radio", opts: scale5 },
      { kind: "section", title: "Section D · Open-ended (optional)" },
      { id: "d1", label: "What challenges does your institution face in delivering gender-responsive or climate-resilient services?", kind: "text" },
      { id: "d2", label: "What support or training would most improve your capacity?", kind: "text" },
      { id: "d3", label: "What are the main barriers SMEs face in accessing your institution's services? (Select all that apply)", kind: "multi", opts: barriers },
    ];

  // TSI
  return [
    { kind: "section", title: "Section A · Respondent information" },
    { id: "a_country", label: "What country do you work in?", kind: "radio", opts: country },
    { id: "a_position", label: "What is your current position?", kind: "radio", opts: ["TSI staff", "TSI manager", "TSI Board member", "Organizational leader", "Other"] },
    { id: "a_gender", label: "Which gender do you identify with?", kind: "radio", opts: gender },
    { id: "a_age", label: "What age group do you belong to?", kind: "radio", opts: age },
    { id: "a_underrep", label: "Do you consider yourself a member of an underrepresented group?", kind: "radio", opts: ["Yes", "No"] },
    { kind: "section", title: "Section B · TSI module — tools, approaches & services" },
    { id: "b1_has", label: "Does your institution currently have any tools, approaches, or services to support SMEs in the processed food sector?", kind: "radio", opts: ["Yes", "No"] },
    { id: "b1_types", label: "Which tools/approaches/services were implemented? (Select all that apply)", kind: "multi", opts: ["Export readiness assessment tools", "Market intelligence tools", "Digital advisory platforms", "Environmental sustainability strategies", "Climate change resilience strategies", "Climate Change Action Plans", "Gender Action Plans (GAPs)", "Gender-responsive service delivery tools", "Climate-resilient business advisory tools", "Other"] },
    { id: "b1_count", label: "How many tools/approaches or services do you currently have?", kind: "radio", opts: ["0", "1", "2", "3", "Other"] },
    { id: "b1_desc", label: "Please briefly describe each tool/service implemented.", kind: "text" },
    { id: "b21", label: "How would you rate your current capacity to deliver inclusive, gender-responsive, and sustainable export readiness services to SMEs?", kind: "radio", opts: scale5 },
    { id: "b31", label: "How would you rate your capacity to support SMEs in adopting climate-resilient practices?", kind: "radio", opts: scale5 },
    { id: "b41", label: "How would you rate your understanding of how to mainstream GESI into your institution's structure and service delivery?", kind: "radio", opts: scale5 },
    { kind: "section", title: "Section D · Open-ended (optional)" },
    { id: "d1", label: "What challenges does your institution face in delivering gender-responsive or climate-resilient services?", kind: "text" },
    { id: "d2", label: "What support or training would most improve your capacity?", kind: "text" },
    { id: "d3", label: "What are the main barriers SMEs face in accessing your institution's services? (Select all that apply)", kind: "multi", opts: barriers },
  ];
}

export function qCount(type: RespondentType | string): number {
  return surveyDef(type).filter((q) => q.kind !== "section").length;
}
