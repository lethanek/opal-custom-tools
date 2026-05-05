import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";
import crypto from "node:crypto";

interface ContentParameters {
    cmp_client_id: string;
    cmp_client_secret: string;
}


async function createWorkRequest(parameters: ContentParameters) {

  const { cmp_client_id, cmp_client_secret } = parameters; 
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

    async function addWorkRequest(cmpToken: string){
       const response = await fetch("https://api.cmp.optimizely.com/v3/work-requests", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cmpToken}`

            },
            body: JSON.stringify({
                "form_fields":[
                    {
                        "type":"text",
                        "identifier":"title",
                        "values":["Created in Opal Workflow"]}],
                        "template_id":"7148a30956f345ee89e9395f550f9016"
                    })
        });

        const data = await response.json();
       
    }
    await addWorkRequest(token);

    

  content = "Work Request Created Successfully";

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
    }
  ],
})(createWorkRequest);