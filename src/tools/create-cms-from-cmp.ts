import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";

interface ContentParameters {
    task_id: string;
    step_id: string;
    substep_id: string;
    cms_url: string;
}


async function createContent(parameters: ContentParameters) {
  const { task_id, step_id, substep_id, cms_url } = parameters;
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

    //get the content from the cmp
    let cmpContent = null;
    async function getCMPContent(cmpToken: string){
       const response = await fetch(`https://api.cmp.optimizely.com/v3/tasks/${task_id}/assets`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cmpToken}`
            }
        });

        const data = await response.json();
        
        if (data.access_token) {
    
            cmpContent = {
                cmpTitle: data.data.title,
                cmpHtml: data.data.content.html
            }

            await createCMSContent(cmsToken!, cmpContent.cmpTitle, cmpContent.cmpHtml);
            return cmpContent
        } else {
            throw new Error("No access token received");
        }
    }
    await getCMPContent(cmpToken!);

    // create the cms entry
    async function createCMSContent(cmpToken: string,cmsToken: string, cmpTitle: string, cmpHtml: string){
       const response = await fetch(`https://api.cms.optimizely.com/preview3/experimental/content`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cmsToken}`
            },
            body: JSON.stringify({
                "key": crypto.randomUUID().replace(/-/g, ""),
                "contentType": "ArticlePage",
                "locale": "en",
                "container": "cfded4a1349441b78cdace9ab584748f",
                "status": "draft",
                "displayName": `${cmpTitle}`,
                "properties": {
                    "Heading": `${cmpTitle}`,
                    "SubHeading": "",
                    "Body": `${cmpHtml}`,
                    "SeoSettings": {
                        "GraphType": "article"
                    },
                    "PromoImage": "cms://content/7c187dc65b064a1ba98ffb5f4b9ca61e"
                }
            })
        });

        const data = await response.json();
        
        if (data.routeSegment) {
    
            const response = await fetch(`https://api.cms.https://api.cmp.optimizely.com/v3/tasks/${task_id}/steps/${step_id}/sub-steps/${substep_id}/​external-work.com/preview3/experimental/content`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${cmpToken}`
                },
                body: JSON.stringify({
                    "title":"[[title]]",
                    "status":"Complete",
                    "url":`https://cms.optimizely.com/content/${data.routeSegment}`
                })
            });

            const updateStep = await response.json();
        
            if (data) {
                return "Content Created Successfully";
            } else {
                throw new Error("No access token received");
            }
        } 
    }
    //await getCMPContent(cmpToken!);


  return {
    "Content created successfully";
  };
}



tool({
  name: "create_cms_from_cmp",
  description:
    "Gets content from a CMP and creates a CMS entry",
  parameters: [
     {
      name: "task_id",
      type: ParameterType.String,
      description: "ID of the task",
      required: true,
    },
     {
      name: "step_id",
      type: ParameterType.String,
      description: "Step ID of the task",
      required: true,
    },
     {
      name: "substep_id",
      type: ParameterType.String,
      description: "Substep ID of the task",
      required: true,
    },
     {
      name: "cms_url",
      type: ParameterType.String,
      description: "URL of the CMS",
      required: true,
    }
  ],
})(createContent);