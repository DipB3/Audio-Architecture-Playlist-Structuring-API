import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { FileBlob, PresentationFile } from 'file:///C:/Users/Vaibhav/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';

const root = path.resolve('.');
const skill = 'C:/Users/Vaibhav/.codex/plugins/cache/openai-primary-runtime/presentations/26.1013.11914/skills/presentations';
const source = path.join(root, 'deliverables', 'Audio_Architecture_Presentation.pptx');
const finalPath = path.join(root, 'deliverables', 'Audio_Architecture_Presentation_Final.pptx');
const build = path.join(root, '.artifact-build', 'deck-refresh');
await fs.mkdir(build, { recursive: true });
const deck = await PresentationFile.importPptx(await FileBlob.load(source));
const evidence = JSON.parse(await fs.readFile(path.join(root, 'docs', 'TEST_RESULTS.json'), 'utf8'));
const average = label => evidence.benchmark.reduce((sum, row) => sum + row[label].duration_error_seconds, 0) / evidence.benchmark.length;
const bodies = [
  null,
  null,
  'React builder captures duration, genres, energy shape and custom tracks.\nPython API sequences tracks by energy, BPM, and Camelot compatibility.\nLocal storage keeps playlists; Terraform defines two DynamoDB tables.\nM3U, JSON and CSV exports are built only from stored playlists.',
  null,
  '118 fictional demo tracks across seven genres.\nFour scenario starters exercise focus, movement, evening, and mixed sessions.\nUsers can add metadata-only songs and exclude catalog tracks.\nRepeat, BPM, genre variety, and planned crossfade remain adjustable.',
  'Terraform defines CloudFront, private S3, API Gateway, Lambda, and DynamoDB.\nGitHub Actions tests every push; API Gateway throttles to 5 req/s.\nGated deploy: approve the Terraform plan, then approve its apply.',
  `43 backend tests pass. Frontend lint and build pass.\nLocal HTTP custom-track CRUD, generation, history, and exports pass.\nAcross 12 historical 48-track cases, mean duration error changed from ${average('original').toFixed(1)}s to ${average('improved').toFixed(1)}s.\nThe wider search costs more CPU time than the original engine.`,
  'Demo: choose a scenario, generate, inspect trajectory and transitions.\nAdd custom song metadata and try another session.\nReload history and export the tracklist.\nCI checks pass; AWS deployment remains pending account setup.'
];
const titles = { 5: 'Catalog and session controls', 6: 'Cloud architecture and release gate' };
const inspection = await deck.inspect({ select: '$.slides[*]', include: ['id', 'index', 'elements.id', 'elements.text'], fileName: path.join(build, 'source-inspect.ndjson') });
if (inspection.recordCount !== 8) throw new Error(`Expected 8 source slides, found ${inspection.recordCount}`);
for (const slide of deck.slides.items) {
  const index = deck.slides.items.indexOf(slide);
  const shapes = slide.shapes.items.filter(shape => shape.text && String(shape.text).trim());
  if (shapes.length < 2) throw new Error(`Slide ${index + 1} has no editable title/body pair.`);
  const [titleShape, bodyShape] = shapes;
  if (titles[index + 1]) titleShape.text = titles[index + 1];
  if (bodies[index]) bodyShape.text = bodies[index];
  slide.speakerNotes.text = 'Source: repository implementation and docs/TEST_RESULTS.json, verified locally 22 October 2026. The 12-case engine comparison uses the original 48-track catalog. No AWS deployment has been verified. Custom tracks contain metadata only; M3U exports need user-supplied audio files.';
  await fs.writeFile(path.join(build, `slide-${index + 1}.png`),
    new Uint8Array(await (await deck.export({ slide, format: 'png', scale: 1 })).arrayBuffer()));
}
const candidatePath = path.join(build, 'candidate.pptx');
await (await PresentationFile.exportPptx(deck)).save(candidatePath);
const { finalizePresentation } = await import(pathToFileURL(path.join(skill, 'container_tools/artifact_tool_utils.mjs')));
await finalizePresentation({
  workspaceDir: root, candidatePath, finalPath,
  pythonExecutable: 'C:/Users/Vaibhav/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
  integrityValidatorPath: path.join(skill, 'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath: path.join(skill, 'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs: ['--expected-slide-size-emu', '12192000,6858000', '--validate-heading-fit'],
  fontPolicy: { basis: 'reference', families: ['Arial'], referencePath: source,
    referenceSha256: createHash('sha256').update(await fs.readFile(source)).digest('hex') },
  explicitTotalSlideCount: 8, verifyArtifactToolImport: true,
  receiptPath: path.join(build, 'presentation-final.validation.json')
});
console.log(`Updated presentation: ${finalPath}`);
