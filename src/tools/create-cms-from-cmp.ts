import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";

interface ContentParameters {
    task_id: string;
    step_id: string;
    substep_id: string;
    cms_url: string;
}


async function createContent(parameters: ContentParameters) {
  const { task_id, step_id, substep_id, cms_url } = parameters;

    // get the cmp token
    let cmpToken = null;
    async function getCMPToken(){
       const response = await fetch("https://accounts.cmp.optimizely.com/o/oauth2/v1/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                    "client_id": "c3299596-7176-4360-84a3-c8871bd85f7b",
                "client_secret": "67600fb515df373c1e195826a94ee9303d78a178f8b78363125ee1d143586c02",
                "grant_type": "client_credentials"
            })
        });

        const data = await response.json();
        
        if (data.access_token) {
            cmpToken = data.access_token;
            return data.access_token;
        } else {
            throw new Error("No access token received");
        }
    }
    await getCMPToken();

    // get the cms token
    let cmsToken = null;
    async function getCMSToken(){
       const response = await fetch("https://api.cms.optimizely.com/oauth/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "grant_type": "client_credentials",
                "client_id": "64cf088b82e44b3e859fc9be19ac025f",   
                "client_secret": "ozbayC0QsoAeqLYC5tfBfTsfbLHLrIGPk5SEBWaTiYLoiEHe",
                "act_as": "dan.oneil@optimizely.com" 
            })
        });

        const data = await response.json();
        
        if (data.access_token) {
            cmsToken = data.access_token;
            return data.access_token;
        } else {
            throw new Error("No access token received");
        }
    }
    await getCMSToken();



  let content: string;
  content = "cmp token = " + cmpToken + "\n";
  content += "cmstoken = " + cmsToken



  return {
    content
  };
}



tool({
  name: "create_cms_from_cmp",
  description:
    "Gets content from a CMP and creates a CMS entry",
  parameters: [],
})(createContent);