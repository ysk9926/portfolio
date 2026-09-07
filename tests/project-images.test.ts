import assert from 'node:assert/strict';
import test from 'node:test';
import { mergePortfolioProjects } from '../lib/projects/portfolio';
import projects from '../data/projects.json';
import sync from '../data/project-portfolio-sync.json';

const origin = 'https://portfolio-project-images-167217328107.s3.ap-northeast-2.amazonaws.com';

test('project images from both saved projects and sync data are served from S3 without changing input', () => {
  for (const syncData of [sync, { generatedAt: '', projects: [] }]) {
    const before = JSON.stringify({ projects, syncData });
    const merged = mergePortfolioProjects(projects, syncData);
    assert.ok(merged.length > 0);
    assert.ok(merged.some((project) => project.thumbnail));
    for (const project of merged) {
      assert.ok(project.thumbnail === '' || project.thumbnail.startsWith(`${origin}/images/projects/`));
      for (const screenshot of project.screenshots) {
        assert.ok(screenshot.startsWith(`${origin}/images/projects/`));
      }
    }
    assert.equal(JSON.stringify({ projects, syncData }), before);
  }
});

test('existing external URLs, profile images and empty values remain intact', () => {
  for (const value of ['', '/images/profile/profile.jpeg', 'https://example.com/image.png']) {
    const input = [{ ...projects[0], thumbnail: value, screenshots: [value] }];
    const [project] = mergePortfolioProjects(input, { generatedAt: '', projects: [] });
    assert.equal(project.thumbnail, value);
    assert.deepEqual(project.screenshots, [value]);
  }
});
