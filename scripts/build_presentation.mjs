import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from 'file:///C:/Users/Vaibhav/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';

const root = path.resolve('.');
const build = path.join(root, '.artifact-build');
const skill = 'C:/Users/Vaibhav/.codex/plugins/cache/openai-primary-runtime/presentations/26.1009.11318/skills/presentations';
await fs.mkdir(build, {recursive:true});
await fs.mkdir(path.join(root,'deliverables'), {recursive:true});
const evidence = JSON.parse(await fs.readFile('docs/TEST_RESULTS.json','utf8'));
const average = label => evidence.benchmark.reduce((sum,row)=>sum+row[label].duration_error_seconds,0)/evidence.benchmark.length;
const deck = Presentation.create({slideSize:{width:1280,height:720}});
const slides = [
  ['Audio Architecture and\nPlaylist Structuring API',
   'Cloud Computing and DevOps mini project\nTeam 6, Batch B2, Section B\nDipankar Banerjee, Pratham Shah and Vaibhav Bhatia\nSupervisor: Dr. Soumya Nandan Mishra'],
  ['The curation problem',
   'Long sessions need an intentional energy curve.\nManual selection makes genre, tempo and key transitions difficult.\nUsers specify duration and desired energy, then receive a structured tracklist.'],
  ['The four synopsis modules',
   'React dashboard captures duration, genres and energy control points.\nPython API sequences tracks using energy, BPM and Camelot keys.\nDynamoDB keeps playlists and generation history.\nS3 stores M3U, JSON and CSV export artifacts.'],
  ['Playlist engine improvements',
   'Beam search keeps alternative paths with different finishing times.\nThree samples per track measure fit across its duration.\nCached transition features reduce repeated calculations.\nFinal scoring balances duration accuracy and musical continuity.'],
  ['Session controls',
   'BPM bounds and exclusions define the eligible catalog.\nRepeat control supports longer sessions or unique tracklists.\nGenre variety balances coverage with transition affinity.\nPlanned crossfade changes timing and records overlap metadata.'],
  ['Cloud architecture and delivery',
   'CloudFront serves the React application from private S3.\nAPI Gateway invokes the packaged Python Lambda function.\nTerraform defines infrastructure and uses an S3 state backend.\nGitHub Actions tests, validates, deploys and checks the API.'],
  ['Measured local verification',
   `37 backend tests pass. Frontend lint and build pass.\nHTTP generation, retrieval, history and all exports pass.\nAcross 12 scenarios, mean duration error changed from ${average('original').toFixed(1)}s to ${average('improved').toFixed(1)}s.\nThe wider search costs more CPU time than the original engine.`],
  ['Demo and deployment status',
   'Demo: shape a curve, set preferences and generate a session.\nInspect target energy, actual tracks and transition diagnostics.\nLoad the saved result and export the tracklist.\nAWS release requires a GitHub remote, OIDC role and state bucket.'],
];
for (let index=0; index<slides.length; index++) {
  const [title,body]=slides[index];
  const slide=deck.slides.add();
  slide.background.fill='#0F172A';
  const addText=(text,top,height,size,color,bold=false)=>{
    const shape=slide.shapes.add({geometry:'textbox',
      position:{left:80,top,width:1120,height},fill:'none',
      line:{fill:'none',width:0}});
    shape.text=text;
    shape.text.style={typeface:'Arial',fontSize:size,color,bold};
  };
  addText(title,index===0?95:65,index===0?170:120,index===0?54:44,'#FFFFFF',true);
  addText(body,index===0?325:240,350,28,'#CBD5E1');
  slide.speakerNotes.text='Sources: CCD_Miniproject_Synopsis.docx, backend/app/engine/optimizer.py, docs/TEST_RESULTS.json, terraform/, .github/workflows/ci-cd.yml. Audio previews synthesize motifs. The catalog contains demonstration metadata, and exported audio paths need supplied media. AWS deployment is not yet verified.';
  await fs.writeFile(path.join(build,`slide-${index+1}.png`),
    new Uint8Array(await (await deck.export({slide,format:'png',scale:1})).arrayBuffer()));
}
const candidate=path.join(build,'candidate.pptx');
await (await PresentationFile.exportPptx(deck)).save(candidate);
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')));
await finalizePresentation({
  workspaceDir:root,candidatePath:candidate,
  finalPath:path.join(root,'deliverables','Audio_Architecture_Presentation.pptx'),
  pythonExecutable:'C:/Users/Vaibhav/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
  integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],
  fontPolicy:{basis:'design',families:['Arial']},
  explicitTotalSlideCount:8,verifyArtifactToolImport:true,
  receiptPath:path.join(build,'presentation.validation.json'),
});
console.log('Presentation created and validated.');
