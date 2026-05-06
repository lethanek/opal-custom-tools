import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";
import crypto from "node:crypto";

interface ContentParameters {
    cmp_client_id: string;
    cmp_client_secret: string;
    wr_name: string;
    wr_description: string;
    wr_startDate: string;
    wr_sfdccampaign: string;
}


async function createWorkRequest(parameters: ContentParameters) {

  const { cmp_client_id, cmp_client_secret, wr_name, wr_description, wr_startDate, wr_sfdccampaign } = parameters;
  let content: string;

    // get the cmp token
    let cmpToken = null;
    async function getCMPToken(){
       const response = await fetch("https://accounts.cmp.optimizely.com/o/oauth2/v1/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "client_id": `${cmp_client_id}`,
                "client_secret": `${cmp_client_secret}`,
                "grant_type": "client_credentials"
            })
        });

        const data = await response.json();
        
        if (data.access_token) {
            cmpToken = data.access_token;
            return data.access_token;
        } else {
            throw new Error("No CMP access token received");
        }
        
    }
    const token = await getCMPToken();

//create the work request here

    async function addWorkRequest(cmpToken: string, wr_name: string, wr_description: string, wr_startDate: string, wr_sfdccampaign: string): Promise<string> {
       const response = await fetch("https://api.cmp.optimizely.com/v3/work-requests", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cmpToken}`

            },
            body: JSON.stringify({
                "form_fields": [
                    {
                        "type": "text",
                        "identifier": "title",
                        "values": [`${wr_name}`]
                    },
                    {
                        "identifier": "short_description",
                        "type": "text_area",
                        "values": [`${wr_description}`]
                    },
                    {
                        "identifier": "due_date",
                        "type": "date",
                        "values": [`${wr_startDate}T12:00:00Z`]
                    },
                    {
                      "identifier": "69fb6d17d478f88d2e00f901",
                      "type": "text",
                      "values": [
                        `https://orgfarm-b8e306d363-dev-ed.develop.lightning.force.com/lightning/r/Campaign/${wr_sfdccampaign}/view`
                      ]
                    }
                ],
                "template_id": "7148a30956f345ee89e9395f550f9016"
            })
        });

        const data = await response.json();
        return data.id;
    }
    const workRequestId = await addWorkRequest(token, wr_name, wr_description, wr_startDate, wr_sfdccampaign);

  content = JSON.stringify({
    status: "Work Request Created Successfully",
    workRequestId: workRequestId,
    salesforceCampaignId: wr_sfdccampaign
  });

  return {
    content
  };
}



tool({
  name: "create_cmp_work_request",
  description:
    "Creates a work request in CMP",
  parameters: [
     {
      name: "cmp_client_id",
      type: ParameterType.String,
      description: "CMP Client ID",
      required: true,
    },
     {
      name: "cmp_client_secret",
      type: ParameterType.String,
      description: "CMP Client Secret",
      required: true,
    },
    {
      name: "wr_name",
      type: ParameterType.String,
      description: "Campaign name",
      required: true,
    },
    {
      name: "wr_description",
      type: ParameterType.String,
      description: "Campaign description",
      required: true,
    },
    {
      name: "wr_startDate",
      type: ParameterType.String,
      description: "Campaign Start Date",
      required: true,
    },
    {
      name: "wr_sfdccampaign",
      type: ParameterType.String,
      description: "SFDC Campaign Link",
      required: true,
    }
  ],
})(createWorkRequest);