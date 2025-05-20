
export const getEditorConfig = (
  imageUploadHandler: (blobInfo: any, progress: (percent: number) => void) => Promise<string>,
  notesContent: string
) => {
  return {
    height: "100%",
    menubar: true,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | formatselect | ' +
      'bold italic forecolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'removeformat | image table link | help',
    content_style: `
      body { 
        font-family: Helvetica, Arial, sans-serif; 
        font-size: 14px; 
        line-height: 1.6; 
        padding: 15px; 
      }
      h1 { 
        color: rgb(71, 0, 0); 
        font-size: 24px; 
        margin-top: 24px; 
        margin-bottom: 16px; 
        font-weight: bold;
      }
      h1 span { 
        text-decoration: underline; 
        color: rgb(71, 0, 0);
      }
      h2 { 
        color: rgb(26, 1, 157); 
        font-size: 20px; 
        margin-top: 20px; 
        margin-bottom: 12px; 
        font-weight: bold;
      }
      h2 span { 
        text-decoration: underline; 
        color: rgb(26, 1, 157);
      }
      h3 { 
        color: rgb(52, 73, 94); 
        font-size: 18px; 
        margin-top: 16px; 
        margin-bottom: 10px; 
        font-weight: bold;
      }
      h3 span { 
        text-decoration: underline; 
        color: rgb(52, 73, 94);
      }
      p { 
        margin-bottom: 12px; 
        line-height: 1.5;
      }
      strong { 
        font-weight: bold; 
      }
      u { 
        text-decoration: underline; 
      }
      table { 
        border-collapse: collapse; 
        width: 100%; 
        margin-bottom: 16px; 
      }
      th, td { 
        border: 1px solid #ddd; 
        padding: 8px; 
        text-align: left; 
      }
      th { 
        background-color: #f2f2f2; 
      }
      ul, ol { 
        margin-left: 20px; 
        margin-bottom: 16px; 
        padding-left: 20px;
      }
      li {
        margin-bottom: 8px;
      }
      ul li {
        list-style-type: disc;
      }
      ol li {
        list-style-type: decimal;
      }
      img { 
        max-width: 100%; 
        height: auto; 
      }
      pre {
        white-space: pre-wrap;
        background-color: #f5f5f5;
        padding: 10px;
        border: 1px solid #ddd;
        margin-bottom: 16px;
        font-family: monospace;
      }
    `,
    formats: {
      p: { block: 'p', styles: { 'margin-bottom': '12px' } },
      h1: { block: 'h1', styles: { 'margin-top': '24px', 'margin-bottom': '16px' } },
      h2: { block: 'h2', styles: { 'margin-top': '20px', 'margin-bottom': '12px' } },
      h3: { block: 'h3', styles: { 'margin-top': '16px', 'margin-bottom': '10px' } },
      bold: { inline: 'strong' },
      italic: { inline: 'em' }
    },
    images_upload_handler: imageUploadHandler,
    automatic_uploads: true,
    file_picker_types: 'image',
    file_picker_callback: function(callback: (value: string, meta?: any) => void, value: string, meta: any) {
      if (meta.filetype === 'image') {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        
        input.onchange = function() {
          if (input.files && input.files[0]) {
            const file = input.files[0];
            
            const reader = new FileReader();
            reader.onload = function(e) {
              callback(e.target?.result as string, { title: file.name });
            };
            reader.readAsDataURL(file);
          }
        };
        
        input.click();
      }
    },
    setup: function(editor: any) {
      editor.ui.registry.addButton('resetNotes', {
        text: 'Reset Notes',
        onAction: function() {
          editor.setContent(notesContent);
        }
      });
      
      editor.on('PastePreProcess', function(e: any) {
        let content = e.content;
        
        if (content.includes('*') || content.includes('-') || content.includes('•')) {
          content = content.replace(/(\*|\-|•)\s+([^*\-•<]+)(<br>|$)/g, '<li>$2</li>');
          
          if (content.includes('<li>')) {
            content = '<ul>' + content + '</ul>';
            content = content.replace(/<\/ul><ul>/g, '');
          }
        }
        
        if (content.match(/\d+\.\s+/)) {
          content = content.replace(/(\d+)\.\s+([^<]+)(<br>|$)/g, '<li>$2</li>');
          
          if (content.includes('<li>') && !content.includes('<ul>')) {
            content = '<ol>' + content + '</ol>';
            content = content.replace(/<\/ol><ol>/g, '');
          }
        }
        
        e.content = content;
      });
    },
    extended_valid_elements: "img[class|src|border=0|alt|title|hspace|vspace|width|height|align|onmouseover|onmouseout|name],h1[*],h2[*],h3[*],h4[*],h5[*],h6[*],strong[*],span[*],div[*],p[*],ul[*],ol[*],li[*],table[*],tr[*],td[*],th[*],pre[*],code[*]",
    valid_elements: '*[*]',
    entity_encoding: 'raw',
    convert_urls: false,
    valid_children: "+body[style],+body[link]",
    invalid_elements: '',
    indent: true,
    indent_use_margin: true,
    indent_margin: true
  };
};

