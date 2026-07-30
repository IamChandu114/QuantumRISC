`timescale 1ns / 1ps

module data_memory(

    input  logic        clk,
    input  logic        MemRead,
    input  logic        MemWrite,

    input  logic [31:0] address,
    input  logic [31:0] write_data,

    output logic [31:0] read_data

);

logic [31:0] memory [0:255];
integer i;

initial begin
    for(i=0;i<256;i=i+1)
        memory[i] = 32'd0;
end

always_ff @(posedge clk) begin
    if(MemWrite)
        memory[address[9:2]] <= write_data;
end

always_comb begin
    if(MemRead)
        read_data = memory[address[9:2]];
    else
        read_data = 32'd0;
end

endmodule