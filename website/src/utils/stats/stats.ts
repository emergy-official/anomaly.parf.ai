import benchmark from "~/utils/stats/benchmarks.json"
import stats from "~/utils/stats/stats_for_website.json"
export const COLORS = ['#2a9d8f', '#f4a261', '#e76f51', "#264653"];
// export const COLORS = ['#2a9d8f', '#f4a261', '#e76f51', "#264653"];

export const getDatasetSizeChart = () => {
    return Object.keys(stats).map(e => ({
        name: e.replace("_", " "),
        value: stats[e].baseline.length
    }));
}
export const getBenchmarkF1Score = (dataset) => {
    return [{
        name: "Baseline",
        "F1 score": benchmark[dataset]["Baseline F1 TEST"].toFixed(2)
    }, {
        name: "Baseline EI",
        "F1 score": benchmark[dataset]["Baseline EI F1 TEST"].toFixed(2)
    }, {
        name: "Efficient AD",
        "F1 score": benchmark[dataset]["EfficientAD F1 TEST"].toFixed(2)
    }, {
        name: "FOMO AD",
        "F1 score": benchmark[dataset]["FOMOAD F1 TEST"].toFixed(2)
    }]
}
export const getBenchmarkF1ScorePerDifficulty = (dataset, model) => {

    let modelTranslate = {
        baseline: "Baseline",
        "baseline-ei": "Baseline EI",
        efficientad: "EfficientAD",
        fomoad: "FOMOAD"
    }

    const m = modelTranslate[model]

    return [{
        name: "No anomaly",
        "F1 score": parseFloat(benchmark[dataset][`${m} F1 NO ANOMALY TEST`].toFixed(2)),
        fill: COLORS[3]
    }, {
        name: "Easy",
        "F1 score": parseFloat(benchmark[dataset][`${m} F1 EASY TEST`].toFixed(2)),
        fill: COLORS[0]
    }, {
        name: "Medium",
        "F1 score": parseFloat(benchmark[dataset][`${m} F1 MEDIUM TEST`].toFixed(2)),
        fill: COLORS[1]
    }, {
        name: "Hard",
        "F1 score": parseFloat(benchmark[dataset][`${m} F1 HARD TEST`].toFixed(2)),
        fill: COLORS[2]
    }]
}

export const getDatasetDistribution = () => {
    return Object.keys(stats).map((e) => ({
        name: e.replace("_", " "),
        "no anomaly": stats["cookies_1"]["baseline"].filter(e => e.d == "na").length,
        easy: stats["cookies_1"]["baseline"].filter(e => e.d == "easy").length,
        medium: stats["cookies_1"]["baseline"].filter(e => e.d == "medium").length,
        hard: stats["cookies_1"]["baseline"].filter(e => e.d == "hard").length,
    }))
}
export const getDatasetTableData = (dataset, model) => {
    const res = stats[dataset][model].map(e => ({
        Image: {
            origin: e.i.replace("datasets/", "/datasets/"),
            result: e.r ? e.r.replace("datasets/", "/datasets/results/") : null,
        },
        "Ground Truth": e.c.replace("_", " "),
        Difficulty: e.d,
        Prediction: e.cl,
        Score: parseFloat(e.s.toFixed(3)),
        "Time (ms)": e.t.toFixed(0),
    })).sort((a, b) => b.Score - a.Score);
    console.log(res[0])
    return res
}