import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";
import crypto from "node:crypto";

interface ContentParameters {
    task_id: string;
    step_id: string;
    substep_id: string;
    cmp_client_id: string;
    cmp_client_secret: string;
    cms_client_id: string;
    cms_client_secret: string;
    cms_act_as: string;
    cms_container: string;
    cms_placeholder_image: string;
    cms_article_path: string;
    cms_root_domain: string;
    netlify_external_preview_token: string;

}


async function createContent(parameters: ContentParameters) {

  const { task_id, step_id, substep_id, cmp_client_id, cmp_client_secret, cms_client_id, cms_client_secret, cms_act_as, cms_container, cms_placeholder_image, cms_article_path, cms_root_domain, netlify_external_preview_token } = parameters; 
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
                "client_id": `${cms_client_id}`,   
                "client_secret": `${cms_client_secret}`,
                "act_as": `${cms_act_as}` 
            })
        });

        const data = await response.json();
        
        if (data.access_token) {
            cmsToken = data.access_token;
            return data.access_token;
        } else {
            throw new Error("No CMS access token received");
        }
    }
    await getCMSToken();

    //get the article content from the cmp
    //let cmpTitle = null;
    //let cmpHtml = null;
    async function getCMPArticleContent(cmpToken: string){
       const response = await fetch(`https://api.cmp.optimizely.com/v3/tasks/${task_id}/assets`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cmpToken}`
            }
        });

        const data = await response.json();
        
        if (data) {
    
            cmpTitle = data.data[0].title;
            cmpHtml = data.data[0].content.value;

            await createCMSContent(cmpToken!, cmsToken!, cmpTitle, cmpHtml);
            
            return data;
        } else {
            throw new Error("Could not get CMP content");
        }
    }
    //await getCMPArticleContent(cmpToken!);


//get the structured content from the cmp
    let cmpTitle = null;
    let cmpHtml = null;
    let cmpMetaTitle = null;
    let cmpMetaDescription = null;
    async function getCMPStructuredContent(cmpToken: string){
       const response = await fetch(`https://api.cmp.optimizely.com/v3/tasks/${task_id}/assets`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cmpToken}`
            }
        });

        const data = await response.json();
        
        if (data) {
    
            let structuredContentItemUrl = data.data[0].content.value;
            const fetchStructuredContent = await fetch(`${structuredContentItemUrl}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${cmpToken}`
                }
            });
            
            const structuredContent = await fetchStructuredContent.json();

            if(structuredContent){
                let cmpTitle = structuredContent.latest_fields_version.fields.title[0].field_values[0].text_value;
                let cmpHtml = structuredContent.latest_fields_version.fields.body[0].field_values[0].rich_text_value;
                let cmpAuthor = structuredContent?.latest_fields_version?.fields?.author?.[0]?.field_values?.[0]?.text_value ?? "Optimizely Author";                
                let cmpMetaTitle = structuredContent?.latest_fields_version?.fields?.metaTitle[0]?.field_values[0]?.text_value ?? "";
                let cmpMetaDescription = structuredContent?.latest_fields_version?.fields?.metaDescription[0]?.field_values[0]?.text_value ?? "";

                await createCMSContent(cmpToken!, cmsToken!, cmpTitle, cmpHtml, cmpMetaTitle, cmpMetaDescription, cmpAuthor, cms_container, cms_placeholder_image, cms_article_path, cms_root_domain);
            
                return data;
            }

            
        } else {
            throw new Error("Could not get CMP content");
        }
    }
    await getCMPStructuredContent(cmpToken!);


    // create the cms entry
    async function createCMSContent(cmpToken: string, cmsToken: string, cmpTitle: string, cmpHtml: string, cmpMetaTitle?: string, cmpMetaDescription?: string, cmpAuthor?: string, cms_container?: string, cms_placeholder_image?: string, cms_article_path?: string, cms_root_domain?: string){
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
                "container": `${cms_container}`,
                "status": "draft",
                "displayName": `${cmpTitle}`,
                "properties": {
                    "Heading": `${cmpTitle}`,
                    "SubHeading": "",
                    "Body": `${cmpHtml}`,
                    "Author": `${cmpAuthor || "Optimizely Author"}`,
                    "SeoSettings": {
                        "GraphType": "article",
                        "MetaDescription": cmpMetaDescription || "",
                        "MetaTitle": cmpMetaTitle || ""
                    },
                    "PageAdminSettings": {
                        "EnableExternalPreview": true
                    },
                    "PromoImage": `cms://content/${cms_placeholder_image}`
                }
            })
        }); 
        
        const data = await response.json();

        if (data.routeSegment) {

            const previewToken = crypto
                .createHash('sha256')
                .update(`${netlify_external_preview_token}:${data.key}:${data.version}`)
                .digest('hex')
                .substring(0, 16);
                
            const cmsContentUrl = `${cms_root_domain}externalpreview${cms_article_path}${data.routeSegment}/?ver=${data.version}&token=${previewToken}`;

            const addURL = await fetch(`https://api.cmp.optimizely.com/v3/tasks/${task_id}/urls`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${cmpToken}`
                },
                body: JSON.stringify({
                    "title": `${cmpTitle}`,
                    "url":`${cmsContentUrl}`
                })
            });
            
            await addURL.json();

            const updateTask = await fetch(`https://api.cmp.optimizely.com/v3/tasks/${task_id}/steps/${step_id}/sub-steps/${substep_id}/external-work`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${cmpToken}`
                },
                body: JSON.stringify({
                    "title":`${cmpTitle}`,
                    "status":"Complete",
                    "url":`${cmsContentUrl}`
                })
            });

            await updateTask.json();
            
            const completeStep = await fetch(`https://api.cmp.optimizely.com/v3/tasks/${task_id}/steps/${step_id}/sub-steps/${substep_id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${cmpToken}`
                },
                body: JSON.stringify({
                    "is_completed":true
                })
            });

            

        } else {
            throw new Error("didn't return routeSegment");
        }
    }
    //await getCMPContent(cmpToken!);



  content = "Content Created Successfully";

  return {
    content
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
      name: "cms_client_id",
      type: ParameterType.String,
      description: "CMS Client ID",
      required: true,
    },
     {
      name: "cms_client_secret",
      type: ParameterType.String,
      description: "CMS Client Secret",
      required: true,
    },
     {
      name: "cms_act_as",
      type: ParameterType.String,
      description: "CMS Act As",
      required: true,
    },
     {
      name: "cms_container",
      type: ParameterType.String,
      description: "Container for the content creation",
      required: true,
    },
     {
      name: "cms_placeholder_image",
      type: ParameterType.String,
      description: "Placeholder image for the post.",
      required: true,
    },
     {
      name: "cms_article_path",
      type: ParameterType.String,
      description: "URL path for the link for the article.",
      required: true,
    },
     {
      name: "cms_root_domain",
      type: ParameterType.String,
      description: "Root domain for SaaS Site.",
      required: true,
    },
     {
      name: "netlify_external_preview_token",
      type: ParameterType.String,
      description: "Token for Netlify external preview.",
      required: true,
    }
  ],
})(createContent);