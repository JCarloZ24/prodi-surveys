// Respondent qualification logic ported from the design prototype's
// `classify(q)`. Maps the profile answers to a survey path, qualification
// status, and any QA flags.

import type { Classification, Qual } from "./types";

export function classify(q: Qual): Classification {
  const map: Record<string, string> = {
    gov: "TSI",
    tech: "AgriTech",
    food: "SME",
    other: "",
  };
  const surveyType = map[q.orgType] || "";
  let assignedType = "Needs Review";
  let status = "Needs Review";
  const flags: string[] = [];

  if (q.orgType === "gov") {
    if (q.govSupports === "Yes") {
      assignedType = "TSI";
      status = "Qualified";
    } else {
      assignedType = "Needs Review";
      status = "Needs Review";
      if (q.govSupports === "No") flags.push("Does not support SMEs");
    }
  } else if (q.orgType === "tech") {
    if (q.techSells === "Yes") {
      assignedType = "Agri-Tech Provider";
      status = "Qualified";
    } else {
      assignedType = "Needs Review";
      status = "Needs Review";
      if (q.techSells === "No")
        flags.push("Does not serve food processing businesses");
    }
  } else if (q.orgType === "food") {
    if (q.foodMakes === "Yes") {
      assignedType = "Food Processing SME";
      status = "Qualified";
    } else if (q.foodMakes === "No") {
      assignedType = "Not Qualified";
      status = "Not Qualified";
      flags.push("Food business does not process food products");
    }
    if (q.foodRole === "Other") flags.push("Role unclear");
  } else if (q.orgType === "other") {
    assignedType = "Needs Review";
    status = "Needs Review";
    flags.push("Respondent selected Other");
  }

  return { assignedType, status, flags, surveyType };
}

export function blankQual(): Qual {
  return {
    orgType: "",
    govOrg: "",
    govDept: "",
    govSupports: "",
    techTypes: [],
    techSells: "",
    foodMakes: "",
    foodProducts: "",
    foodEmployees: "",
    foodRole: "",
    orgName: "",
  };
}
