// Loading network data:
Promise.all([
    d3.csv("simpsonsNodes.csv"),
    d3.csv("simpsonsEdges.csv"),
    d3.csv("simpsons_ep-char.csv")
]).then(([nodesData, edgesData, episodesData]) => {
    const nodes = nodesData.map(d => ({
        id: d.id,
        name: d.character_name,
    }));
    const links = edgesData.map(d => ({
        source: String(d.source),
        target: String(d.target),
        weight: +d.weight
    }));
    const episodesByCharacter = d3.group(
        episodesData,
        d => d.character_id
    );
    nodes.forEach(node => {
        const eps = episodesByCharacter.get(node.id) || [];
        node.episodes = eps.map(d => d.episode);
        node.numEpisodes = node.episodes.length;
    });

    const graph = {nodes: nodes, links: links};

    console.log(graph);
});



